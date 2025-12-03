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

export async function fetchUserActivities(token, org, username) {
  const activities = []
  const repoSet = new Set()
  
  try {
    // Fetch organization repos
    const repos = await fetchWithAuth(
      `${GITHUB_API_BASE}/orgs/${org}/repos?per_page=100&sort=pushed`,
      token
    )
    
    // Fetch commits and PRs from each repo (limit to recently pushed repos)
    const recentRepos = repos.slice(0, 30) // Limit to 30 most recently pushed repos
    
    const fetchPromises = recentRepos.map(async (repo) => {
      const repoActivities = []
      
      try {
        // Fetch commits by the user
        const commits = await fetchWithAuth(
          `${GITHUB_API_BASE}/repos/${org}/${repo.name}/commits?author=${username}&per_page=50`,
          token
        )
        
        for (const commit of commits) {
          repoSet.add(repo.name)
          repoActivities.push({
            id: commit.sha,
            type: 'commit',
            repo: repo.name,
            repoFullName: `${org}/${repo.name}`,
            message: commit.commit.message.split('\n')[0], // First line only
            fullMessage: commit.commit.message,
            date: commit.commit.author.date,
            sha: commit.sha,
            shortSha: commit.sha.substring(0, 7),
            url: commit.html_url,
            author: commit.author?.login || commit.commit.author.name,
            avatarUrl: commit.author?.avatar_url,
            additions: commit.stats?.additions,
            deletions: commit.stats?.deletions,
            branch: null, // We'll get this from the API if available
          })
        }
      } catch (e) {
        // Silently skip repos we can't access
        console.warn(`Could not fetch commits from ${repo.name}:`, e.message)
      }
      
      try {
        // Fetch PRs by the user
        const prs = await fetchWithAuth(
          `${GITHUB_API_BASE}/repos/${org}/${repo.name}/pulls?state=all&per_page=50`,
          token
        )
        
        const userPRs = prs.filter(pr => pr.user.login === username)
        
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
            state: pr.merged_at ? 'merged' : pr.state, // 'open', 'closed', 'merged'
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
    
    // Sort by date descending
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

