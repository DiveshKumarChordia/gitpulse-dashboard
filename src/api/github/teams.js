/**
 * GitHub Teams API
 * Team management and data fetching
 */

const GITHUB_API_BASE = 'https://api.github.com'

async function fetchWithAuth(url, token) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitPulse-Dashboard',
    },
  })
  if (!response.ok) {
    if (response.status === 403) throw new Error('Rate limit exceeded')
    if (response.status === 404) return null
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

// ============ FETCH USER'S TEAMS ============
export async function fetchUserTeams(token, org) {
  try {
    // First try user's teams endpoint (most reliable)
    const userTeams = await fetchWithAuth(`${GITHUB_API_BASE}/user/teams?per_page=100`, token)
    if (userTeams) {
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
    }
    
    // Fallback to org teams
    const teams = await fetchWithAuth(`${GITHUB_API_BASE}/orgs/${org}/teams?per_page=100`, token)
    if (teams) {
      return teams.map(team => ({
        id: team.id,
        name: team.name,
        slug: team.slug,
        description: team.description,
        privacy: team.privacy,
        membersCount: team.members_count,
        reposCount: team.repos_count,
      }))
    }
    
    return []
  } catch (error) {
    console.warn('Failed to fetch teams:', error)
    return []
  }
}

// ============ FETCH TEAM MEMBERS ============
export async function fetchTeamMembers(token, org, teamSlug) {
  try {
    const members = await fetchWithAuth(
      `${GITHUB_API_BASE}/orgs/${org}/teams/${teamSlug}/members?per_page=100`,
      token
    )
    if (!members) return []
    
    return members.map(m => ({
      login: m.login,
      avatarUrl: m.avatar_url,
      url: m.html_url,
      type: m.type,
      id: m.id,
    }))
  } catch (error) {
    console.warn('Failed to fetch team members:', error)
    return []
  }
}

// ============ FETCH TEAM REPOSITORIES ============
export async function fetchTeamRepos(token, org, teamSlug) {
  try {
    const repos = await fetchWithAuth(
      `${GITHUB_API_BASE}/orgs/${org}/teams/${teamSlug}/repos?per_page=100`,
      token
    )
    if (!repos) return []
    
    return repos.map(r => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      private: r.private,
      defaultBranch: r.default_branch || 'main',
      permissions: r.permissions,
      language: r.language,
      stargazersCount: r.stargazers_count,
      forksCount: r.forks_count,
      openIssuesCount: r.open_issues_count,
      pushedAt: r.pushed_at,
    }))
  } catch (error) {
    console.warn('Failed to fetch team repos:', error)
    return []
  }
}

// ============ FETCH TEAM INFO ============
export async function fetchTeamInfo(token, org, teamSlug) {
  try {
    const team = await fetchWithAuth(
      `${GITHUB_API_BASE}/orgs/${org}/teams/${teamSlug}`,
      token
    )
    if (!team) return null
    
    return {
      id: team.id,
      name: team.name,
      slug: team.slug,
      description: team.description,
      privacy: team.privacy,
      membersCount: team.members_count,
      reposCount: team.repos_count,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
    }
  } catch (error) {
    console.warn('Failed to fetch team info:', error)
    return null
  }
}

