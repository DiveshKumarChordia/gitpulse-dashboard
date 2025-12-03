const GITHUB_API_BASE = 'https://api.github.com'

async function fetchWithAuth(url, token) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid GitHub token. Please check your Personal Access Token.')
    }
    if (response.status === 403) {
      const remaining = response.headers.get('X-RateLimit-Remaining')
      if (remaining === '0') {
        throw new Error('GitHub API rate limit exceeded. Please try again later.')
      }
      throw new Error('Access forbidden. Make sure your token has the required permissions.')
    }
    if (response.status === 404) {
      throw new Error('Organization not found or you don\'t have access to it.')
    }
    throw new Error(`GitHub API error: ${response.statusText}`)
  }
  
  return response.json()
}

// Fetch all pages of a paginated endpoint
async function fetchAllPages(baseUrl, token, maxPages = 10) {
  const allItems = []
  let page = 1
  
  while (page <= maxPages) {
    const separator = baseUrl.includes('?') ? '&' : '?'
    const url = `${baseUrl}${separator}page=${page}&per_page=100`
    
    try {
      const items = await fetchWithAuth(url, token)
      if (items.length === 0) break
      allItems.push(...items)
      if (items.length < 100) break // Last page
      page++
    } catch (e) {
      break
    }
  }
  
  return allItems
}

export async function fetchAllOrgRepos(token, org) {
  try {
    const repos = await fetchAllPages(
      `${GITHUB_API_BASE}/orgs/${org}/repos?sort=pushed`,
      token,
      10 // Fetch up to 1000 repos
    )
    return repos.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      pushedAt: repo.pushed_at,
      updatedAt: repo.updated_at,
      private: repo.private,
      url: repo.html_url,
    }))
  } catch (error) {
    console.error('Error fetching repos:', error)
    return []
  }
}

export async function fetchUserActivities(token, org, username, onProgress) {
  const activities = []
  const repoSet = new Set()
  
  try {
    // Fetch ALL organization repos
    const repos = await fetchAllPages(
      `${GITHUB_API_BASE}/orgs/${org}/repos?sort=pushed`,
      token,
      10
    )
    
    const totalRepos = repos.length
    let processedRepos = 0
    
    // Process repos in batches to avoid rate limiting
    const batchSize = 5
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize)
      
      const fetchPromises = batch.map(async (repo) => {
        const repoActivities = []
        
        try {
          // Fetch ALL commits by the user (paginated)
          const commits = await fetchAllPages(
            `${GITHUB_API_BASE}/repos/${org}/${repo.name}/commits?author=${username}`,
            token,
            5 // Up to 500 commits per repo
          )
          
          for (const commit of commits) {
            repoSet.add(repo.name)
            repoActivities.push({
              id: commit.sha,
              type: 'commit',
              repo: repo.name,
              repoFullName: `${org}/${repo.name}`,
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
        } catch (e) {
          console.warn(`Could not fetch commits from ${repo.name}:`, e.message)
        }
        
        try {
          // Fetch ALL PRs (paginated)
          const allPRs = await fetchAllPages(
            `${GITHUB_API_BASE}/repos/${org}/${repo.name}/pulls?state=all`,
            token,
            5 // Up to 500 PRs per repo
          )
          
          const userPRs = allPRs.filter(pr => pr.user.login === username)
          
          for (const pr of userPRs) {
            repoSet.add(repo.name)
            repoActivities.push({
              id: `pr-${pr.id}`,
              type: 'pr',
              repo: repo.name,
              repoFullName: `${org}/${repo.name}`,
              message: pr.title,
              body: pr.body,
              date: pr.created_at,
              updatedAt: pr.updated_at,
              closedAt: pr.closed_at,
              mergedAt: pr.merged_at,
              number: pr.number,
              url: pr.html_url,
              state: pr.merged_at ? 'merged' : pr.state,
              author: pr.user.login,
              avatarUrl: pr.user.avatar_url,
              branch: pr.head.ref,
              baseBranch: pr.base.ref,
              additions: pr.additions,
              deletions: pr.deletions,
              changedFiles: pr.changed_files,
              comments: pr.comments,
              reviewComments: pr.review_comments,
              labels: pr.labels?.map(l => ({ name: l.name, color: l.color })) || [],
              draft: pr.draft,
            })
          }
        } catch (e) {
          console.warn(`Could not fetch PRs from ${repo.name}:`, e.message)
        }
        
        return repoActivities
      })
      
      const results = await Promise.allSettled(fetchPromises)
      
      for (const result of results) {
        if (result.status === 'fulfilled') {
          activities.push(...result.value)
        }
      }
      
      processedRepos += batch.length
      if (onProgress) {
        onProgress({
          processed: processedRepos,
          total: totalRepos,
          percentage: Math.round((processedRepos / totalRepos) * 100)
        })
      }
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < repos.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    // Sort by date descending (most recent first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return {
      activities,
      repos: Array.from(repoSet).sort(),
    }
  } catch (error) {
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
