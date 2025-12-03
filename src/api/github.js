const GITHUB_API_BASE = 'https://api.github.com'
const GITHUB_GRAPHQL = 'https://api.github.com/graphql'
const CACHE_KEY = 'gitpulse-cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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
  } catch {
    return null
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.warn('Cache write failed:', e)
  }
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
    },
  })
  
  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid GitHub token.')
    if (response.status === 403) throw new Error('Rate limit exceeded or access forbidden.')
    if (response.status === 404) throw new Error('Organization not found.')
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
    },
    body: JSON.stringify({ query, variables }),
  })
  
  if (!response.ok) {
    throw new Error(`GraphQL error: ${response.statusText}`)
  }
  
  const result = await response.json()
  if (result.errors) {
    console.warn('GraphQL errors:', result.errors)
  }
  return result.data
}

// Fetch repos with GraphQL
async function fetchReposGraphQL(token, org, cursor = null) {
  const query = `
    query($org: String!, $cursor: String) {
      organization(login: $org) {
        repositories(first: 100, after: $cursor, orderBy: {field: PUSHED_AT, direction: DESC}) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name
            description
            pushedAt
            url
            isPrivate
          }
        }
      }
    }
  `
  return graphqlQuery(token, query, { org, cursor })
}

// Fetch user commits via search API
async function fetchUserCommitsSearch(token, org, username) {
  const query = `author:${username} org:${org}`
  const url = `${GITHUB_API_BASE}/search/commits?q=${encodeURIComponent(query)}&sort=author-date&order=desc&per_page=100`
  
  const results = []
  let page = 1
  const maxPages = 10
  
  while (page <= maxPages) {
    try {
      const response = await fetch(`${url}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.cloak-preview+json',
        },
      })
      
      if (!response.ok) break
      
      const data = await response.json()
      results.push(...data.items)
      
      if (data.items.length < 100 || results.length >= data.total_count) break
      page++
    } catch (e) {
      console.warn('Commit search error:', e)
      break
    }
  }
  
  return results
}

// Fetch user PRs via search API
async function fetchUserPRsSearch(token, org, username) {
  const query = `author:${username} org:${org} is:pr`
  const url = `${GITHUB_API_BASE}/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=100`
  
  const results = []
  let page = 1
  const maxPages = 10
  
  while (page <= maxPages) {
    try {
      const response = await fetch(`${url}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })
      
      if (!response.ok) break
      
      const data = await response.json()
      results.push(...data.items)
      
      if (data.items.length < 100 || results.length >= data.total_count) break
      page++
    } catch (e) {
      console.warn('PR search error:', e)
      break
    }
  }
  
  return results
}

// ============ CODE SEARCH ============
export async function searchCode(token, query, org, repos = [], options = {}) {
  const { language, path, extension } = options
  
  // Build search query
  let searchQuery = query
  
  // Add org filter
  if (org) {
    searchQuery += ` org:${org}`
  }
  
  // Add repo filters
  if (repos.length > 0) {
    // GitHub search allows up to 100 repos in query
    const repoFilters = repos.slice(0, 10).map(r => `repo:${org}/${r}`).join(' ')
    searchQuery += ` ${repoFilters}`
  }
  
  // Add language filter
  if (language) {
    searchQuery += ` language:${language}`
  }
  
  // Add path filter
  if (path) {
    searchQuery += ` path:${path}`
  }
  
  // Add extension filter
  if (extension) {
    searchQuery += ` extension:${extension}`
  }
  
  const url = `${GITHUB_API_BASE}/search/code?q=${encodeURIComponent(searchQuery)}&per_page=100`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3.text-match+json', // Get text match highlights
      },
    })
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Rate limit exceeded. Please wait a moment.')
      }
      if (response.status === 422) {
        throw new Error('Search query too complex. Try simpler terms.')
      }
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Process results
    return {
      totalCount: data.total_count,
      incompleteResults: data.incomplete_results,
      items: data.items.map(item => ({
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
        // Text matches show where the query was found
        textMatches: item.text_matches?.map(match => ({
          fragment: match.fragment,
          matches: match.matches?.map(m => ({
            text: m.text,
            indices: m.indices,
          })),
        })) || [],
      })),
    }
  } catch (error) {
    console.error('Code search error:', error)
    throw error
  }
}

// Get file content
export async function getFileContent(token, owner, repo, path) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3.raw',
        },
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch file')
    }
    
    return response.text()
  } catch (error) {
    console.error('Get file error:', error)
    throw error
  }
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
      })))
      
      if (!repos.pageInfo.hasNextPage) break
      cursor = repos.pageInfo.endCursor
    }
  } catch (e) {
    console.warn('GraphQL repo fetch failed, falling back to REST:', e)
    const repos = await fetchWithAuth(
      `${GITHUB_API_BASE}/orgs/${org}/repos?per_page=100&sort=pushed`,
      token
    )
    return repos.map(repo => ({
      name: repo.name,
      description: repo.description,
      pushedAt: repo.pushed_at,
      url: repo.html_url,
      private: repo.private,
    }))
  }
  
  return allRepos
}

export async function fetchUserActivities(token, org, username, onProgress, useCache = true) {
  if (useCache) {
    const cached = getCache()
    if (cached && cached.org === org && cached.username === username) {
      onProgress?.({ processed: 100, total: 100, percentage: 100, cached: true })
      return cached
    }
  }
  
  onProgress?.({ processed: 0, total: 100, percentage: 0, status: 'Fetching commits...' })
  
  const activities = []
  const repoSet = new Set()
  
  try {
    const [commitsResult, prsResult] = await Promise.all([
      fetchUserCommitsSearch(token, org, username),
      fetchUserPRsSearch(token, org, username),
    ])
    
    onProgress?.({ processed: 50, total: 100, percentage: 50, status: 'Processing data...' })
    
    for (const commit of commitsResult) {
      const repoName = commit.repository.name
      repoSet.add(repoName)
      
      activities.push({
        id: commit.sha,
        type: 'commit',
        repo: repoName,
        repoFullName: commit.repository.full_name,
        message: commit.commit.message.split('\n')[0],
        fullMessage: commit.commit.message,
        date: commit.commit.author.date,
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        url: commit.html_url,
        author: commit.author?.login || commit.commit.author.name,
        avatarUrl: commit.author?.avatar_url,
        branch: null,
      })
    }
    
    onProgress?.({ processed: 75, total: 100, percentage: 75, status: 'Processing PRs...' })
    
    for (const pr of prsResult) {
      const repoFullName = pr.repository_url.replace('https://api.github.com/repos/', '')
      const repoName = repoFullName.split('/')[1]
      repoSet.add(repoName)
      
      let state = pr.state
      if (pr.pull_request?.merged_at) {
        state = 'merged'
      }
      
      activities.push({
        id: `pr-${pr.id}`,
        type: 'pr',
        repo: repoName,
        repoFullName: repoFullName,
        message: pr.title,
        body: pr.body,
        date: pr.created_at,
        updatedAt: pr.updated_at,
        closedAt: pr.closed_at,
        mergedAt: pr.pull_request?.merged_at,
        number: pr.number,
        url: pr.html_url,
        state: state,
        author: pr.user.login,
        avatarUrl: pr.user.avatar_url,
        branch: null,
        baseBranch: null,
        additions: null,
        deletions: null,
        changedFiles: null,
        comments: pr.comments,
        reviewComments: null,
        labels: pr.labels?.map(l => ({ name: l.name, color: l.color })) || [],
        draft: pr.draft,
      })
    }
    
    activities.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    const result = {
      activities,
      repos: Array.from(repoSet).sort(),
      org,
      username,
    }
    
    setCache(result)
    onProgress?.({ processed: 100, total: 100, percentage: 100, status: 'Complete!' })
    
    return result
    
  } catch (error) {
    console.error('Error fetching activities:', error)
    throw error
  }
}

export async function validateToken(token) {
  try {
    const user = await fetchWithAuth(`${GITHUB_API_BASE}/user`, token)
    return { valid: true, user }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

export async function fetchUserOrgs(token) {
  try {
    const orgs = await fetchWithAuth(`${GITHUB_API_BASE}/user/orgs`, token)
    return orgs.map(org => ({
      login: org.login,
      avatarUrl: org.avatar_url,
      description: org.description,
    }))
  } catch (error) {
    throw error
  }
}
