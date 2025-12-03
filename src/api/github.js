const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_GRAPHQL = 'https://api.github.com/graphql'
const CACHE_KEY = 'gitpulse-cache'
const CACHE_TTL = 5 * 60 * 1000

// ============ CACHING ============
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch { return null }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
  } catch (e) { console.warn('Cache write failed:', e) }
}

export function clearCache() {
  localStorage.removeItem(CACHE_KEY)
}

// ============ REST API HELPERS ============
async function fetchWithAuth(url, token) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitPulse-Dashboard',
    },
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid GitHub token.')
    if (response.status === 403) throw new Error('Rate limit exceeded or access forbidden.')
    if (response.status === 404) throw new Error('Not found.')
    throw new Error(`GitHub API error: ${response.statusText}`)
  }
  
  return response.json()
}

// ============ GRAPHQL API ============
async function graphqlQuery(token, query, variables = {}) {
  const response = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'GitPulse-Dashboard',
    },
    body: JSON.stringify({ query, variables }),
  })
  
  if (!response.ok) throw new Error(`GraphQL error: ${response.statusText}`)
  const result = await response.json()
  if (result.errors) console.warn('GraphQL errors:', result.errors)
  return result.data
}

async function fetchReposGraphQL(token, org, cursor = null) {
  const query = `
    query($org: String!, $cursor: String) {
      organization(login: $org) {
        repositories(first: 100, after: $cursor, orderBy: {field: PUSHED_AT, direction: DESC}) {
          pageInfo { hasNextPage endCursor }
          nodes { name description pushedAt url isPrivate defaultBranchRef { name } }
        }
      }
    }
  `
  return graphqlQuery(token, query, { org, cursor })
}

// ============ REPOSITORY STRUCTURE ============
export async function fetchBranches(token, owner, repo) {
  const branches = []
  let page = 1
  while (true) {
    try {
      const data = await fetchWithAuth(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=100&page=${page}`, token)
      branches.push(...data.map(b => ({ name: b.name, sha: b.commit.sha, protected: b.protected })))
      if (data.length < 100) break
      page++
    } catch (e) { break }
  }
  return branches
}

export async function fetchRepoTree(token, owner, repo, branch = 'main') {
  try {
    const branchData = await fetchWithAuth(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`, token)
    const treeSha = branchData.commit.commit.tree.sha
    const treeData = await fetchWithAuth(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, token)
    return buildFileTree(treeData.tree)
  } catch (e) { throw e }
}

function buildFileTree(items) {
  const root = { name: '', path: '', type: 'tree', children: [] }
  for (const item of items) {
    const parts = item.path.split('/')
    let current = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join('/')
      let child = current.children.find(c => c.name === part)
      if (!child) {
        child = { name: part, path: currentPath, type: isLast ? item.type : 'tree', sha: isLast ? item.sha : undefined, children: [] }
        current.children.push(child)
      }
      current = child
    }
  }
  const sortTree = (node) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type === 'tree' && b.type !== 'tree') return -1
        if (a.type !== 'tree' && b.type === 'tree') return 1
        return a.name.localeCompare(b.name)
      })
      node.children.forEach(sortTree)
    }
  }
  sortTree(root)
  return root.children
}

// ============ SEARCH COMMITS ============
export async function searchCommits(token, query, org, repos = [], branches = []) {
  // Build search query
  let searchQuery = query
  
  if (repos.length > 0) {
    // Search specific repos
    const repoQueries = repos.slice(0, 5).map(r => `repo:${org}/${r}`).join(' ')
    searchQuery += ` ${repoQueries}`
  } else {
    searchQuery += ` org:${org}`
  }

  const url = `${GITHUB_API_BASE}/search/commits?q=${encodeURIComponent(searchQuery)}&sort=committer-date&order=desc&per_page=50`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.cloak-preview+json',
        'User-Agent': 'GitPulse-Dashboard',
      },
    })
    
    if (!response.ok) {
      if (response.status === 403) throw new Error('Rate limit exceeded')
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Filter by branches if specified
    let items = data.items || []
    
    return {
      totalCount: data.total_count,
      items: items.map(commit => ({
        type: 'commit',
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0],
        fullMessage: commit.commit.message,
        date: commit.commit.committer.date,
        url: commit.html_url,
        author: commit.author?.login || commit.commit.author.name,
        avatarUrl: commit.author?.avatar_url,
        repository: {
          name: commit.repository.name,
          fullName: commit.repository.full_name,
        },
      })),
    }
  } catch (error) {
    console.error('Commit search error:', error)
    throw error
  }
}

// ============ SEARCH PRS ============
export async function searchPRs(token, query, org, repos = []) {
  // Build search query - search in title and body
  let searchQuery = `${query} is:pr`
  
  if (repos.length > 0) {
    const repoQueries = repos.slice(0, 5).map(r => `repo:${org}/${r}`).join(' ')
    searchQuery += ` ${repoQueries}`
  } else {
    searchQuery += ` org:${org}`
  }

  const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(searchQuery)}&sort=created&order=desc&per_page=50`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse-Dashboard',
      },
    })
    
    if (!response.ok) {
      if (response.status === 403) throw new Error('Rate limit exceeded')
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return {
      totalCount: data.total_count,
      items: (data.items || []).map(pr => {
        const repoUrl = pr.repository_url
        const repoFullName = repoUrl.replace('https://api.github.com/repos/', '')
        const repoName = repoFullName.split('/')[1]
        
        return {
          type: 'pr',
          number: pr.number,
          title: pr.title,
          body: pr.body,
          state: pr.state,
          date: pr.created_at,
          updatedAt: pr.updated_at,
          url: pr.html_url,
          author: pr.user.login,
          avatarUrl: pr.user.avatar_url,
          labels: pr.labels?.map(l => ({ name: l.name, color: l.color })) || [],
          repository: {
            name: repoName,
            fullName: repoFullName,
          },
        }
      }),
    }
  } catch (error) {
    console.error('PR search error:', error)
    throw error
  }
}

// ============ CODE SEARCH ============
export async function searchCode(token, query, org, repo, options = {}) {
  const { paths = [], language, extension } = options
  
  let searchQuery = query.trim()
  
  if (repo) {
    searchQuery += ` repo:${org}/${repo}`
  } else if (org) {
    searchQuery += ` org:${org}`
  }
  
  if (paths.length > 0) {
    const topPaths = [...new Set(paths.map(p => p.split('/')[0]))].slice(0, 3)
    if (topPaths.length > 0) searchQuery += ` path:${topPaths[0]}`
  }
  
  if (language) searchQuery += ` language:${language}`
  if (extension) searchQuery += ` extension:${extension}`
  
  const url = `${GITHUB_API_BASE}/search/code?q=${encodeURIComponent(searchQuery)}&per_page=50`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.text-match+json',
        'User-Agent': 'GitPulse-Dashboard',
      },
    })
    
    if (!response.ok) {
      if (response.status === 403) throw new Error('Rate limit exceeded')
      if (response.status === 422) throw new Error('Search query too complex')
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return {
      totalCount: data.total_count,
      incompleteResults: data.incomplete_results,
      items: (data.items || []).map(item => ({
        type: 'code',
        name: item.name,
        path: item.path,
        sha: item.sha,
        url: item.html_url,
        repository: {
          name: item.repository.name,
          fullName: item.repository.full_name,
          url: item.repository.html_url,
          private: item.repository.private,
        },
        textMatches: item.text_matches?.map(match => ({
          fragment: match.fragment,
          matches: match.matches?.map(m => ({ text: m.text, indices: m.indices })),
        })) || [],
      })),
    }
  } catch (error) {
    throw error
  }
}

// ============ UNIFIED SEARCH ============
export async function unifiedSearch(token, query, org, options = {}) {
  const { repos = [], branches = [], paths = [], language, extension, searchTypes = ['code', 'commits', 'prs'] } = options
  
  const results = {
    code: { totalCount: 0, items: [] },
    commits: { totalCount: 0, items: [] },
    prs: { totalCount: 0, items: [] },
  }
  
  const promises = []
  
  // Search code
  if (searchTypes.includes('code')) {
    if (repos.length > 0) {
      // Search each repo
      for (const repo of repos.slice(0, 5)) {
        promises.push(
          searchCode(token, query, org, repo, { paths, language, extension })
            .then(r => { results.code.totalCount += r.totalCount; results.code.items.push(...r.items) })
            .catch(() => {})
        )
      }
    } else {
      promises.push(
        searchCode(token, query, org, null, { language, extension })
          .then(r => { results.code = r })
          .catch(() => {})
      )
    }
  }
  
  // Search commits
  if (searchTypes.includes('commits')) {
    promises.push(
      searchCommits(token, query, org, repos, branches)
        .then(r => { results.commits = r })
        .catch(() => {})
    )
  }
  
  // Search PRs
  if (searchTypes.includes('prs')) {
    promises.push(
      searchPRs(token, query, org, repos)
        .then(r => { results.prs = r })
        .catch(() => {})
    )
  }
  
  await Promise.all(promises)
  
  return results
}

// Get file content
export async function getFileContent(token, owner, repo, path, branch = 'main') {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'GitPulse-Dashboard',
        },
      }
    )
    if (!response.ok) throw new Error('Failed to fetch file')
    return response.text()
  } catch (error) { throw error }
}

// ============ MAIN FETCH FUNCTIONS ============
export async function fetchAllOrgRepos(token, org) {
  const allRepos = []
  let cursor = null
  
  try {
    while (true) {
      const data = await fetchReposGraphQL(token, org, cursor)
      const repos = data.organization.repositories
      allRepos.push(...repos.nodes.map(repo => ({
        name: repo.name,
        description: repo.description,
        pushedAt: repo.pushedAt,
        url: repo.url,
        private: repo.isPrivate,
        defaultBranch: repo.defaultBranchRef?.name || 'main',
      })))
      if (!repos.pageInfo.hasNextPage) break
      cursor = repos.pageInfo.endCursor
    }
  } catch (e) {
    const repos = await fetchWithAuth(`${GITHUB_API_BASE}/orgs/${org}/repos?per_page=100&sort=pushed`, token)
    return repos.map(repo => ({
      name: repo.name,
      description: repo.description,
      pushedAt: repo.pushed_at,
      url: repo.html_url,
      private: repo.private,
      defaultBranch: repo.default_branch || 'main',
    }))
  }
  
  return allRepos
}

// FAST version - limit to 2 pages max for team view
async function fetchUserCommitsSearchFast(token, org, username) {
  const query = `author:${username} org:${org}`
  const url = `${GITHUB_API_BASE}/search/commits?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=100`
  const results = []
  let page = 1
  while (page <= 2) { // Only 2 pages for speed
    try {
      const response = await fetch(`${url}&page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.cloak-preview+json', 'User-Agent': 'GitPulse-Dashboard' },
      })
      if (!response.ok) break
      const data = await response.json()
      results.push(...data.items)
      if (data.items.length < 100) break
      page++
    } catch (e) { break }
  }
  return results
}

// Full version for individual user view
async function fetchUserCommitsSearch(token, org, username) {
  const query = `author:${username} org:${org}`
  const url = `${GITHUB_API_BASE}/search/commits?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=100`
  const results = []
  let page = 1
  while (page <= 10) {
    try {
      const response = await fetch(`${url}&page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.cloak-preview+json', 'User-Agent': 'GitPulse-Dashboard' },
      })
      if (!response.ok) break
      const data = await response.json()
      results.push(...data.items)
      if (data.items.length < 100 || results.length >= data.total_count) break
      page++
    } catch (e) { break }
  }
  return results
}

// FAST version - limit to 2 pages max for team view
async function fetchUserPRsSearchFast(token, org, username) {
  const query = `author:${username} org:${org} is:pr`
  const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=100`
  const results = []
  let page = 1
  while (page <= 2) { // Only 2 pages for speed
    try {
      const response = await fetch(`${url}&page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' },
      })
      if (!response.ok) break
      const data = await response.json()
      results.push(...data.items)
      if (data.items.length < 100) break
      page++
    } catch (e) { break }
  }
  return results
}

// Full version for individual user view
async function fetchUserPRsSearch(token, org, username) {
  const query = `author:${username} org:${org} is:pr`
  const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=100`
  const results = []
  let page = 1
  while (page <= 10) {
    try {
      const response = await fetch(`${url}&page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' },
      })
      if (!response.ok) break
      const data = await response.json()
      results.push(...data.items)
      if (data.items.length < 100 || results.length >= data.total_count) break
      page++
    } catch (e) { break }
  }
  return results
}

export async function fetchUserActivities(token, org, username, onProgress, useCache = true) {
  if (useCache) {
    const cached = getCache()
    if (cached && cached.org === org && cached.username === username) {
      onProgress?.({ processed: 100, total: 100, percentage: 100, cached: true })
      return cached
    }
  }
  
  onProgress?.({ processed: 0, total: 100, percentage: 0, status: 'Fetching...' })
  
  const activities = []
  const repoSet = new Set()
  
  try {
    const [commitsResult, prsResult] = await Promise.all([
      fetchUserCommitsSearch(token, org, username),
      fetchUserPRsSearch(token, org, username),
    ])
    
    onProgress?.({ processed: 50, total: 100, percentage: 50, status: 'Processing...' })
    
    for (const commit of commitsResult) {
      const repoName = commit.repository.name
      repoSet.add(repoName)
      activities.push({
        id: commit.sha, type: 'commit', repo: repoName, repoFullName: commit.repository.full_name,
        message: commit.commit.message.split('\n')[0], fullMessage: commit.commit.message,
        date: commit.commit.author.date, sha: commit.sha, shortSha: commit.sha.substring(0, 7),
        url: commit.html_url, author: commit.author?.login || commit.commit.author.name,
        avatarUrl: commit.author?.avatar_url, branch: null,
      })
    }
    
    for (const pr of prsResult) {
      const repoFullName = pr.repository_url.replace('https://api.github.com/repos/', '')
      const repoName = repoFullName.split('/')[1]
      repoSet.add(repoName)
      activities.push({
        id: `pr-${pr.id}`, type: 'pr', repo: repoName, repoFullName,
        message: pr.title, body: pr.body, date: pr.created_at, updatedAt: pr.updated_at,
        closedAt: pr.closed_at, mergedAt: pr.pull_request?.merged_at, number: pr.number,
        url: pr.html_url, state: pr.pull_request?.merged_at ? 'merged' : pr.state,
        author: pr.user.login, avatarUrl: pr.user.avatar_url,
        labels: pr.labels?.map(l => ({ name: l.name, color: l.color })) || [], draft: pr.draft,
      })
    }
    
    activities.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    const result = { activities, repos: Array.from(repoSet).sort(), org, username }
    setCache(result)
    onProgress?.({ processed: 100, total: 100, percentage: 100, status: 'Complete!' })
    return result
  } catch (error) { throw error }
}

export async function validateToken(token) {
  try {
    const user = await fetchWithAuth(`${GITHUB_API_BASE}/user`, token)
    return { valid: true, user }
  } catch (error) { return { valid: false, error: error.message } }
}

export async function fetchUserOrgs(token) {
  try {
    const orgs = await fetchWithAuth(`${GITHUB_API_BASE}/user/orgs`, token)
    return orgs.map(org => ({ login: org.login, avatarUrl: org.avatar_url, description: org.description }))
  } catch (error) { throw error }
}

// ============ TEAMS API ============

// Fetch all teams the user belongs to in an org
export async function fetchUserTeams(token, org) {
  try {
    const teams = await fetchWithAuth(`${GITHUB_API_BASE}/orgs/${org}/teams?per_page=100`, token)
    // Filter to teams user is a member of
    const userTeams = []
    for (const team of teams) {
      try {
        // Check if user is member of this team
        await fetchWithAuth(`${GITHUB_API_BASE}/orgs/${org}/teams/${team.slug}/memberships/${(await fetchWithAuth(`${GITHUB_API_BASE}/user`, token)).login}`, token)
        userTeams.push({
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          privacy: team.privacy,
          membersCount: team.members_count,
          reposCount: team.repos_count,
        })
      } catch (e) {
        // User not in this team, skip
      }
    }
    return userTeams
  } catch (error) {
    // Fallback: try to get teams via user's team memberships
    try {
      const teams = await fetchWithAuth(`${GITHUB_API_BASE}/user/teams?per_page=100`, token)
      return teams
        .filter(t => t.organization?.login === org)
        .map(team => ({
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          privacy: team.privacy,
          membersCount: team.members_count,
          reposCount: team.repos_count,
          organization: team.organization?.login,
        }))
    } catch (e) {
      throw error
    }
  }
}

// Fetch team members
export async function fetchTeamMembers(token, org, teamSlug) {
  try {
    const members = await fetchWithAuth(`${GITHUB_API_BASE}/orgs/${org}/teams/${teamSlug}/members?per_page=100`, token)
    return members.map(m => ({
      login: m.login,
      avatarUrl: m.avatar_url,
      url: m.html_url,
      type: m.type,
    }))
  } catch (error) { throw error }
}

// Fetch PR reviews for a user (FAST - single page)
async function fetchUserPRReviews(token, org, username) {
  const query = `reviewed-by:${username} org:${org} is:pr`
  const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=50`
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' },
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.items || []
  } catch (e) { return [] }
}

// Fetch PR comments by user (FAST - single page)
async function fetchUserPRComments(token, org, username) {
  const query = `commenter:${username} org:${org} is:pr`
  const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=50`
  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' },
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.items || []
  } catch (e) { return [] }
}

// Fetch single member's activities (for parallel processing) - FAST VERSION
async function fetchMemberActivities(token, org, member) {
  const activities = []
  const stats = {
    login: member.login,
    avatarUrl: member.avatarUrl,
    commits: 0,
    prs: 0,
    reviews: 0,
    comments: 0,
    reposActive: new Set(),
  }
  
  // Fetch ALL data types in PARALLEL for this member (using FAST versions)
  const [commits, prs, reviews, comments] = await Promise.all([
    fetchUserCommitsSearchFast(token, org, member.login).catch(() => []),
    fetchUserPRsSearchFast(token, org, member.login).catch(() => []),
    fetchUserPRReviews(token, org, member.login).catch(() => []),
    fetchUserPRComments(token, org, member.login).catch(() => []),
  ])
  
  // Process commits
  for (const commit of commits) {
    const repoName = commit.repository.name
    stats.commits++
    stats.reposActive.add(repoName)
    activities.push({
      id: `${member.login}-${commit.sha}`,
      type: 'commit',
      repo: repoName,
      repoFullName: commit.repository.full_name,
      message: commit.commit.message.split('\n')[0],
      date: commit.commit.author.date,
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      url: commit.html_url,
      author: member.login,
      avatarUrl: member.avatarUrl,
    })
  }
  
  // Process PRs
  for (const pr of prs) {
    const repoFullName = pr.repository_url.replace('https://api.github.com/repos/', '')
    const repoName = repoFullName.split('/')[1]
    stats.prs++
    stats.reposActive.add(repoName)
    activities.push({
      id: `${member.login}-pr-${pr.id}`,
      type: 'pr',
      repo: repoName,
      repoFullName,
      message: pr.title,
      date: pr.created_at,
      number: pr.number,
      url: pr.html_url,
      state: pr.pull_request?.merged_at ? 'merged' : pr.state,
      author: member.login,
      avatarUrl: member.avatarUrl,
      labels: pr.labels?.map(l => ({ name: l.name, color: l.color })) || [],
    })
  }
  
  // Process reviews
  for (const review of reviews) {
    if (review.user?.login !== member.login) {
      const repoFullName = review.repository_url.replace('https://api.github.com/repos/', '')
      const repoName = repoFullName.split('/')[1]
      stats.reviews++
      activities.push({
        id: `${member.login}-review-${review.id}`,
        type: 'review',
        repo: repoName,
        repoFullName,
        message: `Reviewed PR #${review.number}: ${review.title}`,
        date: review.updated_at,
        number: review.number,
        url: review.html_url,
        author: member.login,
        avatarUrl: member.avatarUrl,
      })
    }
  }
  
  // Process comments
  for (const comment of comments) {
    const repoFullName = comment.repository_url.replace('https://api.github.com/repos/', '')
    const repoName = repoFullName.split('/')[1]
    stats.comments++
    activities.push({
      id: `${member.login}-comment-${comment.id}-${comment.number}`,
      type: 'comment',
      repo: repoName,
      repoFullName,
      message: `Commented on PR #${comment.number}: ${comment.title}`,
      date: comment.updated_at,
      number: comment.number,
      url: comment.html_url,
      author: member.login,
      avatarUrl: member.avatarUrl,
    })
  }
  
  return { activities, stats }
}

// Fetch all team activities - PARALLEL VERSION (FAST!)
export async function fetchTeamActivities(token, org, members, onProgress) {
  onProgress?.({ status: `Loading activities for ${members.length} members in parallel...`, percentage: 10 })
  
  // Process members in parallel batches to avoid rate limits
  const BATCH_SIZE = 5 // Process 5 members at a time
  const allActivities = []
  const allStats = []
  const repoSet = new Set()
  
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(members.length / BATCH_SIZE)
    
    onProgress?.({ 
      status: `Processing batch ${batchNum}/${totalBatches} (${batch.map(m => m.login).join(', ')})...`,
      percentage: Math.round(((i + batch.length) / members.length) * 80) + 10
    })
    
    // Fetch all members in this batch in PARALLEL
    const results = await Promise.all(
      batch.map(member => fetchMemberActivities(token, org, member))
    )
    
    // Aggregate results
    for (const result of results) {
      allActivities.push(...result.activities)
      result.stats.reposActive = result.stats.reposActive.size
      allStats.push(result.stats)
      result.activities.forEach(a => a.repo && repoSet.add(a.repo))
    }
  }
  
  onProgress?.({ status: 'Finalizing...', percentage: 95 })
  
  // Sort by date
  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  // Remove duplicates
  const seen = new Set()
  const uniqueActivities = allActivities.filter(a => {
    const key = `${a.type}-${a.author}-${a.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  onProgress?.({ status: 'Complete!', percentage: 100 })
  
  return {
    activities: uniqueActivities,
    memberStats: allStats,
    repos: Array.from(repoSet).sort(),
  }
}
