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

// Fetch all teams in org (visible to user)
export async function fetchUserTeams(token, org) {
  try {
    // First try user's teams
    const userTeams = await fetchWithAuth(`${GITHUB_API_BASE}/user/teams?per_page=100`, token)
    const orgTeams = userTeams.filter(t => t.organization?.login === org)
    
    if (orgTeams.length > 0) {
      return orgTeams.map(team => ({
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: team.description,
        privacy: team.privacy,
        membersCount: team.members_count,
        reposCount: team.repos_count,
      }))
    }
    
    // Fallback to org teams
    const teams = await fetchWithAuth(`${GITHUB_API_BASE}/orgs/${org}/teams?per_page=100`, token)
    return teams.map(team => ({
      id: team.id,
      name: team.name,
      slug: team.slug,
      description: team.description,
      privacy: team.privacy,
      membersCount: team.members_count,
      reposCount: team.repos_count,
    }))
  } catch (error) {
    console.warn('Failed to fetch teams:', error)
    return []
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
  } catch (error) { 
    console.warn('Failed to fetch team members:', error)
    return []
  }
}

// Fetch team's repositories
export async function fetchTeamRepos(token, org, teamSlug) {
  try {
    const repos = await fetchWithAuth(`${GITHUB_API_BASE}/orgs/${org}/teams/${teamSlug}/repos?per_page=100`, token)
    return repos.map(r => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      private: r.private,
      defaultBranch: r.default_branch || 'main',
      permissions: r.permissions,
    }))
  } catch (error) {
    console.warn('Failed to fetch team repos:', error)
    return []
  }
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

// ============ TEAM REPO ACTIVITIES (ALL activities in team's repos) ============

async function fetchRepoActivitiesDetailed(token, org, repoName) {
  const activities = []
  
  // Fetch commits
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/commits?per_page=100`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' } }
    )
    if (response.ok) {
      const commits = await response.json()
      for (const commit of commits) {
        activities.push({
          id: `repo-${repoName}-commit-${commit.sha}`,
          type: 'commit',
          repo: repoName,
          repoFullName: `${org}/${repoName}`,
          message: commit.commit.message.split('\n')[0],
          fullMessage: commit.commit.message,
          date: commit.commit.author?.date || commit.commit.committer?.date,
          sha: commit.sha,
          shortSha: commit.sha.substring(0, 7),
          url: commit.html_url,
          author: commit.author?.login || commit.commit.author?.name || 'unknown',
          avatarUrl: commit.author?.avatar_url,
          stats: commit.stats,
        })
      }
    }
  } catch (e) { /* continue */ }
  
  // Fetch ALL PRs with details
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' } }
    )
    if (response.ok) {
      const prs = await response.json()
      for (const pr of prs) {
        // PR created
        activities.push({
          id: `repo-${repoName}-pr-${pr.id}`,
          type: 'pr',
          subType: pr.merged_at ? 'merged' : pr.state === 'closed' ? 'closed' : 'opened',
          repo: repoName,
          repoFullName: `${org}/${repoName}`,
          message: pr.title,
          body: pr.body,
          date: pr.created_at,
          mergedAt: pr.merged_at,
          closedAt: pr.closed_at,
          number: pr.number,
          url: pr.html_url,
          state: pr.merged_at ? 'merged' : pr.state,
          author: pr.user?.login,
          avatarUrl: pr.user?.avatar_url,
          labels: pr.labels?.map(l => ({ name: l.name, color: l.color })) || [],
          additions: pr.additions,
          deletions: pr.deletions,
          changedFiles: pr.changed_files,
        })
        
        // If merged, add merge event
        if (pr.merged_at) {
          activities.push({
            id: `repo-${repoName}-merge-${pr.id}`,
            type: 'merge',
            repo: repoName,
            repoFullName: `${org}/${repoName}`,
            message: `Merged PR #${pr.number}: ${pr.title}`,
            date: pr.merged_at,
            number: pr.number,
            url: pr.html_url,
            author: pr.merged_by?.login || pr.user?.login,
            avatarUrl: pr.merged_by?.avatar_url || pr.user?.avatar_url,
            prAuthor: pr.user?.login,
          })
        }
      }
    }
  } catch (e) { /* continue */ }
  
  // Fetch PR reviews
  try {
    const prsResponse = await fetch(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/pulls?state=all&per_page=20`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' } }
    )
    if (prsResponse.ok) {
      const prs = await prsResponse.json()
      for (const pr of prs.slice(0, 10)) {
        try {
          const reviewsResponse = await fetch(
            `${GITHUB_API_BASE}/repos/${org}/${repoName}/pulls/${pr.number}/reviews`,
            { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' } }
          )
          if (reviewsResponse.ok) {
            const reviews = await reviewsResponse.json()
            for (const review of reviews) {
              const reviewType = review.state === 'APPROVED' ? 'approved' : 
                                 review.state === 'CHANGES_REQUESTED' ? 'changes_requested' : 'reviewed'
              activities.push({
                id: `repo-${repoName}-review-${review.id}`,
                type: 'review',
                subType: reviewType,
                repo: repoName,
                repoFullName: `${org}/${repoName}`,
                message: reviewType === 'approved' ? `Approved PR #${pr.number}: ${pr.title}` :
                         reviewType === 'changes_requested' ? `Requested changes on PR #${pr.number}: ${pr.title}` :
                         `Reviewed PR #${pr.number}: ${pr.title}`,
                body: review.body,
                date: review.submitted_at,
                number: pr.number,
                url: review.html_url || pr.html_url,
                author: review.user?.login,
                avatarUrl: review.user?.avatar_url,
                prTitle: pr.title,
                prAuthor: pr.user?.login,
                reviewState: review.state,
              })
            }
          }
        } catch (e) { /* continue */ }
      }
    }
  } catch (e) { /* continue */ }
  
  // Fetch issue/PR comments
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/issues/comments?sort=created&direction=desc&per_page=50`,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'GitPulse-Dashboard' } }
    )
    if (response.ok) {
      const comments = await response.json()
      for (const comment of comments) {
        const issueNumber = comment.issue_url.split('/').pop()
        activities.push({
          id: `repo-${repoName}-comment-${comment.id}`,
          type: 'comment',
          repo: repoName,
          repoFullName: `${org}/${repoName}`,
          message: `Commented on #${issueNumber}`,
          body: comment.body,
          date: comment.created_at,
          url: comment.html_url,
          author: comment.user?.login,
          avatarUrl: comment.user?.avatar_url,
          issueNumber: parseInt(issueNumber),
        })
      }
    }
  } catch (e) { /* continue */ }
  
  return activities
}

// Fetch all activities in team's repos (by anyone) - DETAILED VERSION
export async function fetchTeamRepoActivities(token, org, repos, onProgress) {
  const allActivities = []
  const contributorStats = {}
  const contributorLastActive = {}
  
  const BATCH_SIZE = 3 // Smaller batches due to more API calls per repo
  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE)
    onProgress?.({
      status: `Loading ${batch.map(r => r.name).join(', ')}...`,
      percentage: Math.round((i / repos.length) * 90) + 5
    })
    
    const results = await Promise.all(
      batch.map(repo => fetchRepoActivitiesDetailed(token, org, repo.name))
    )
    
    for (const activities of results) {
      for (const activity of activities) {
        allActivities.push(activity)
        
        const author = activity.author
        if (author && author !== 'unknown') {
          if (!contributorStats[author]) {
            contributorStats[author] = {
              login: author,
              avatarUrl: activity.avatarUrl,
              commits: 0,
              prs: 0,
              reviews: 0,
              comments: 0,
              merges: 0,
              approvals: 0,
              linesAdded: 0,
              linesRemoved: 0,
              reposActive: new Set(),
            }
          }
          
          const s = contributorStats[author]
          if (activity.type === 'commit') {
            s.commits++
            if (activity.stats) {
              s.linesAdded += activity.stats.additions || 0
              s.linesRemoved += activity.stats.deletions || 0
            }
          }
          else if (activity.type === 'pr') s.prs++
          else if (activity.type === 'merge') s.merges++
          else if (activity.type === 'review') {
            s.reviews++
            if (activity.subType === 'approved') s.approvals++
          }
          else if (activity.type === 'comment') s.comments++
          
          s.reposActive.add(activity.repo)
          
          // Track last active date
          const activityDate = new Date(activity.date)
          if (!contributorLastActive[author] || activityDate > contributorLastActive[author]) {
            contributorLastActive[author] = activityDate
          }
        }
      }
    }
  }
  
  // Sort and dedupe
  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date))
  const seen = new Set()
  const unique = allActivities.filter(a => {
    const key = `${a.type}-${a.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  // Calculate inactive status (6+ months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  // Finalize stats
  const stats = Object.values(contributorStats).map(s => ({
    ...s,
    reposActive: s.reposActive.size,
    total: s.commits + s.prs + s.reviews + s.comments,
    lastActive: contributorLastActive[s.login],
    isInactive: contributorLastActive[s.login] ? contributorLastActive[s.login] < sixMonthsAgo : true,
  })).sort((a, b) => b.total - a.total)
  
  onProgress?.({ status: 'Complete!', percentage: 100 })
  
  return { activities: unique, contributorStats: stats }
}

// Fetch single repo activities (for repo selector)
export async function fetchSingleRepoActivities(token, org, repoName, onProgress) {
  onProgress?.({ status: `Loading ${repoName}...`, percentage: 20 })
  const activities = await fetchRepoActivitiesDetailed(token, org, repoName)
  
  const contributorStats = {}
  const contributorLastActive = {}
  
  for (const activity of activities) {
    const author = activity.author
    if (author && author !== 'unknown') {
      if (!contributorStats[author]) {
        contributorStats[author] = {
          login: author,
          avatarUrl: activity.avatarUrl,
          commits: 0, prs: 0, reviews: 0, comments: 0, merges: 0, approvals: 0,
          linesAdded: 0, linesRemoved: 0, reposActive: new Set(),
        }
      }
      const s = contributorStats[author]
      if (activity.type === 'commit') { s.commits++; if (activity.stats) { s.linesAdded += activity.stats.additions || 0; s.linesRemoved += activity.stats.deletions || 0 } }
      else if (activity.type === 'pr') s.prs++
      else if (activity.type === 'merge') s.merges++
      else if (activity.type === 'review') { s.reviews++; if (activity.subType === 'approved') s.approvals++ }
      else if (activity.type === 'comment') s.comments++
      s.reposActive.add(activity.repo)
      
      const activityDate = new Date(activity.date)
      if (!contributorLastActive[author] || activityDate > contributorLastActive[author]) {
        contributorLastActive[author] = activityDate
      }
    }
  }
  
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const stats = Object.values(contributorStats).map(s => ({
    ...s, reposActive: s.reposActive.size, total: s.commits + s.prs + s.reviews + s.comments,
    lastActive: contributorLastActive[s.login],
    isInactive: contributorLastActive[s.login] ? contributorLastActive[s.login] < sixMonthsAgo : true,
  })).sort((a, b) => b.total - a.total)
  
  activities.sort((a, b) => new Date(b.date) - new Date(a.date))
  onProgress?.({ status: 'Complete!', percentage: 100 })
  
  return { activities, contributorStats: stats }
}

// ============ TEAM MEMBER ACTIVITIES (Activities by members ANYWHERE) ============

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
  
  // Fetch ALL data types in PARALLEL
  const [commits, prs, reviews, comments] = await Promise.all([
    fetchUserCommitsSearchFast(token, org, member.login).catch(() => []),
    fetchUserPRsSearchFast(token, org, member.login).catch(() => []),
    fetchUserPRReviews(token, org, member.login).catch(() => []),
    fetchUserPRComments(token, org, member.login).catch(() => []),
  ])
  
  for (const commit of commits) {
    const repoName = commit.repository.name
    stats.commits++
    stats.reposActive.add(repoName)
    activities.push({
      id: `member-${member.login}-${commit.sha}`,
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
  
  for (const pr of prs) {
    const repoFullName = pr.repository_url.replace('https://api.github.com/repos/', '')
    const repoName = repoFullName.split('/')[1]
    stats.prs++
    stats.reposActive.add(repoName)
    activities.push({
      id: `member-${member.login}-pr-${pr.id}`,
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
  
  for (const review of reviews) {
    if (review.user?.login !== member.login) {
      const repoFullName = review.repository_url.replace('https://api.github.com/repos/', '')
      const repoName = repoFullName.split('/')[1]
      stats.reviews++
      activities.push({
        id: `member-${member.login}-review-${review.id}`,
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
  
  for (const comment of comments) {
    const repoFullName = comment.repository_url.replace('https://api.github.com/repos/', '')
    const repoName = repoFullName.split('/')[1]
    stats.comments++
    activities.push({
      id: `member-${member.login}-comment-${comment.id}`,
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

// Fetch activities by team members (anywhere in org)
export async function fetchTeamMemberActivities(token, org, members, onProgress) {
  const allActivities = []
  const allStats = []
  
  const BATCH_SIZE = 5
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE)
    onProgress?.({
      status: `Loading member activities ${i + 1}-${Math.min(i + BATCH_SIZE, members.length)} of ${members.length}...`,
      percentage: Math.round((i / members.length) * 90) + 5
    })
    
    const results = await Promise.all(
      batch.map(m => fetchMemberActivities(token, org, m))
    )
    
    for (const r of results) {
      allActivities.push(...r.activities)
      r.stats.reposActive = r.stats.reposActive.size
      r.stats.total = r.stats.commits + r.stats.prs + r.stats.reviews + r.stats.comments
      allStats.push(r.stats)
    }
  }
  
  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date))
  const seen = new Set()
  const unique = allActivities.filter(a => {
    const key = `${a.type}-${a.author}-${a.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  onProgress?.({ status: 'Complete!', percentage: 100 })
  
  return {
    activities: unique,
    memberStats: allStats.sort((a, b) => b.total - a.total),
  }
}

// ============ RE-EXPORTS FROM MODULAR FILES ============
export * from './github/teams'
export * from './github/activities'
