/**
 * GitHub Activities API
 * Comprehensive activity fetching for all GitHub events
 */

const GITHUB_API_BASE = 'https://api.github.com'

// ============ ALL ACTIVITY TYPES ============
export const ACTIVITY_TYPES = {
  // Commits
  COMMIT: 'commit',
  
  // Pull Requests
  PR_OPENED: 'pr_opened',
  PR_CLOSED: 'pr_closed',
  PR_MERGED: 'pr_merged',
  PR_REOPENED: 'pr_reopened',
  PR_DRAFT: 'pr_draft',
  PR_READY: 'pr_ready',
  
  // Reviews
  REVIEW_APPROVED: 'review_approved',
  REVIEW_CHANGES_REQUESTED: 'review_changes_requested',
  REVIEW_COMMENTED: 'review_commented',
  REVIEW_DISMISSED: 'review_dismissed',
  
  // Comments
  PR_COMMENT: 'pr_comment',
  ISSUE_COMMENT: 'issue_comment',
  COMMIT_COMMENT: 'commit_comment',
  REVIEW_COMMENT: 'review_comment',
  
  // Branches
  BRANCH_CREATED: 'branch_created',
  BRANCH_DELETED: 'branch_deleted',
  
  // Tags
  TAG_CREATED: 'tag_created',
  TAG_DELETED: 'tag_deleted',
  
  // Releases
  RELEASE_PUBLISHED: 'release_published',
  RELEASE_CREATED: 'release_created',
  
  // Issues
  ISSUE_OPENED: 'issue_opened',
  ISSUE_CLOSED: 'issue_closed',
  ISSUE_REOPENED: 'issue_reopened',
  ISSUE_ASSIGNED: 'issue_assigned',
  ISSUE_LABELED: 'issue_labeled',
  
  // Repository
  REPO_FORKED: 'repo_forked',
  REPO_STARRED: 'repo_starred',
  REPO_WIKI: 'repo_wiki',
  
  // Other
  PUSH: 'push',
  MEMBER_ADDED: 'member_added',
}

// ============ ACTIVITY CONFIG ============
export const ACTIVITY_CONFIG = {
  [ACTIVITY_TYPES.COMMIT]: {
    label: 'Commit',
    icon: 'GitCommit',
    color: 'neon-green',
    bg: 'bg-neon-green/10',
    gradient: 'from-neon-green/20 to-neon-green/5',
  },
  [ACTIVITY_TYPES.PR_OPENED]: {
    label: 'PR Opened',
    icon: 'GitPullRequest',
    color: 'purple-400',
    bg: 'bg-purple-500/10',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  [ACTIVITY_TYPES.PR_MERGED]: {
    label: 'PR Merged',
    icon: 'GitMerge',
    color: 'fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    gradient: 'from-fuchsia-500/20 to-fuchsia-500/5',
  },
  [ACTIVITY_TYPES.PR_CLOSED]: {
    label: 'PR Closed',
    icon: 'XCircle',
    color: 'red-400',
    bg: 'bg-red-500/10',
    gradient: 'from-red-500/20 to-red-500/5',
  },
  [ACTIVITY_TYPES.PR_REOPENED]: {
    label: 'PR Reopened',
    icon: 'RefreshCw',
    color: 'orange-400',
    bg: 'bg-orange-500/10',
    gradient: 'from-orange-500/20 to-orange-500/5',
  },
  [ACTIVITY_TYPES.REVIEW_APPROVED]: {
    label: 'Approved',
    icon: 'CheckCircle',
    color: 'green-400',
    bg: 'bg-green-500/10',
    gradient: 'from-green-500/20 to-green-500/5',
  },
  [ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED]: {
    label: 'Changes Requested',
    icon: 'AlertCircle',
    color: 'orange-400',
    bg: 'bg-orange-500/10',
    gradient: 'from-orange-500/20 to-orange-500/5',
  },
  [ACTIVITY_TYPES.REVIEW_COMMENTED]: {
    label: 'Review Comment',
    icon: 'MessageSquare',
    color: 'electric-400',
    bg: 'bg-electric-400/10',
    gradient: 'from-electric-400/20 to-electric-400/5',
  },
  [ACTIVITY_TYPES.PR_COMMENT]: {
    label: 'PR Comment',
    icon: 'MessageCircle',
    color: 'yellow-400',
    bg: 'bg-yellow-400/10',
    gradient: 'from-yellow-400/20 to-yellow-400/5',
  },
  [ACTIVITY_TYPES.ISSUE_COMMENT]: {
    label: 'Issue Comment',
    icon: 'MessageSquare',
    color: 'yellow-400',
    bg: 'bg-yellow-400/10',
    gradient: 'from-yellow-400/20 to-yellow-400/5',
  },
  [ACTIVITY_TYPES.COMMIT_COMMENT]: {
    label: 'Commit Comment',
    icon: 'MessageSquare',
    color: 'cyan-400',
    bg: 'bg-cyan-400/10',
    gradient: 'from-cyan-400/20 to-cyan-400/5',
  },
  [ACTIVITY_TYPES.BRANCH_CREATED]: {
    label: 'Branch Created',
    icon: 'GitBranch',
    color: 'teal-400',
    bg: 'bg-teal-500/10',
    gradient: 'from-teal-500/20 to-teal-500/5',
  },
  [ACTIVITY_TYPES.BRANCH_DELETED]: {
    label: 'Branch Deleted',
    icon: 'Trash2',
    color: 'red-400',
    bg: 'bg-red-500/10',
    gradient: 'from-red-500/20 to-red-500/5',
  },
  [ACTIVITY_TYPES.TAG_CREATED]: {
    label: 'Tag Created',
    icon: 'Tag',
    color: 'blue-400',
    bg: 'bg-blue-500/10',
    gradient: 'from-blue-500/20 to-blue-500/5',
  },
  [ACTIVITY_TYPES.TAG_DELETED]: {
    label: 'Tag Deleted',
    icon: 'Trash2',
    color: 'red-400',
    bg: 'bg-red-500/10',
    gradient: 'from-red-500/20 to-red-500/5',
  },
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: {
    label: 'Release Published',
    icon: 'Rocket',
    color: 'pink-400',
    bg: 'bg-pink-500/10',
    gradient: 'from-pink-500/20 to-pink-500/5',
  },
  [ACTIVITY_TYPES.ISSUE_OPENED]: {
    label: 'Issue Opened',
    icon: 'AlertCircle',
    color: 'green-400',
    bg: 'bg-green-500/10',
    gradient: 'from-green-500/20 to-green-500/5',
  },
  [ACTIVITY_TYPES.ISSUE_CLOSED]: {
    label: 'Issue Closed',
    icon: 'CheckCircle2',
    color: 'purple-400',
    bg: 'bg-purple-500/10',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  [ACTIVITY_TYPES.PUSH]: {
    label: 'Push',
    icon: 'Upload',
    color: 'neon-green',
    bg: 'bg-neon-green/10',
    gradient: 'from-neon-green/20 to-neon-green/5',
  },
  [ACTIVITY_TYPES.REPO_FORKED]: {
    label: 'Forked',
    icon: 'GitFork',
    color: 'indigo-400',
    bg: 'bg-indigo-500/10',
    gradient: 'from-indigo-500/20 to-indigo-500/5',
  },
}

// Default config for unknown types
export const DEFAULT_ACTIVITY_CONFIG = {
  label: 'Activity',
  icon: 'Activity',
  color: 'frost-300',
  bg: 'bg-frost-300/10',
  gradient: 'from-frost-300/20 to-frost-300/5',
}

// ============ FETCH HELPERS ============
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

// ============ FETCH COMMIT DETAILS ============
export async function fetchCommitDetails(token, org, repo, sha) {
  try {
    const data = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repo}/commits/${sha}`,
      token
    )
    if (!data) return null
    
    return {
      sha: data.sha,
      shortSha: data.sha?.substring(0, 7),
      message: data.commit?.message?.split('\n')[0],
      fullMessage: data.commit?.message,
      author: data.author?.login || data.commit?.author?.name,
      authorEmail: data.commit?.author?.email,
      avatarUrl: data.author?.avatar_url,
      date: data.commit?.committer?.date,
      url: data.html_url,
      additions: data.stats?.additions,
      deletions: data.stats?.deletions,
      changedFiles: data.files?.length || 0,
      files: data.files?.map(f => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
      })),
    }
  } catch (e) {
    console.warn('Failed to fetch commit details:', e)
    return null
  }
}

// ============ FETCH PUSH COMMITS (from compare or branch) ============
export async function fetchPushCommits(token, org, repo, beforeSha, afterSha) {
  try {
    // If before is all zeros, this is a new branch - fetch branch commits instead
    if (!beforeSha || beforeSha === '0000000000000000000000000000000000000000') {
      // Just fetch the single commit
      const commit = await fetchCommitDetails(token, org, repo, afterSha)
      return commit ? [commit] : []
    }
    
    // Use compare API
    const data = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repo}/compare/${beforeSha}...${afterSha}`,
      token
    )
    
    if (!data || !data.commits) return []
    
    return data.commits.map(c => ({
      sha: c.sha,
      shortSha: c.sha?.substring(0, 7),
      message: c.commit?.message?.split('\n')[0],
      fullMessage: c.commit?.message,
      author: c.author?.login || c.commit?.author?.name,
      avatarUrl: c.author?.avatar_url,
      date: c.commit?.committer?.date,
      url: c.html_url,
    }))
  } catch (e) {
    console.warn('Failed to fetch push commits:', e)
    return []
  }
}

// ============ FETCH REPO EVENTS (Most comprehensive) ============
export async function fetchRepoEvents(token, org, repoName) {
  const activities = []
  
  try {
    // Fetch repository events (most comprehensive)
    const events = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/events?per_page=100`,
      token
    )
    
    if (events) {
      for (const event of events) {
        const activity = parseGitHubEvent(event, org, repoName)
        if (activity) activities.push(activity)
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch events for ${repoName}:`, e)
  }
  
  return activities
}

// ============ FETCH REPO EVENTS - LAST 24 HOURS ONLY ============
export async function fetchRepoEventsLast24Hours(token, org, repoName) {
  const activities = []
  const cutoffDate = new Date()
  cutoffDate.setHours(cutoffDate.getHours() - 24)
  
  try {
    // Fetch repository events
    const events = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/events?per_page=50`,
      token
    )
    
    if (events) {
      for (const event of events) {
        const eventDate = new Date(event.created_at)
        if (eventDate < cutoffDate) continue // Skip old events
        
        const activity = parseGitHubEvent(event, org, repoName)
        if (activity) activities.push(activity)
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch events for ${repoName}:`, e)
  }
  
  return activities
}

// ============ FETCH TEAM REPO ACTIVITIES - LAST 24 HOURS ============
export async function fetchTeamRepoActivitiesLast24Hours(token, org, repos, onProgress) {
  const allActivities = []
  const cutoffDate = new Date()
  cutoffDate.setHours(cutoffDate.getHours() - 24)
  
  const BATCH_SIZE = 5
  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE)
    onProgress?.({
      status: `Checking ${batch.map(r => r.name).join(', ')}...`,
      percentage: Math.round((i / repos.length) * 100)
    })
    
    const results = await Promise.all(
      batch.map(repo => fetchRepoEventsLast24Hours(token, org, repo.name))
    )
    
    for (const activities of results) {
      allActivities.push(...activities)
    }
  }
  
  // Sort and dedupe
  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date))
  const seen = new Set()
  const unique = allActivities.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })
  
  onProgress?.({ status: 'Complete!', percentage: 100 })
  
  return unique
}

// ============ PARSE GITHUB EVENT ============
function parseGitHubEvent(event, org, repoName) {
  const fullRepoName = `${org}/${repoName}`
  const base = {
    id: `${fullRepoName}-${event.id}`,
    repo: fullRepoName,  // Use FULL name for consistency (org/repo)
    repoShort: repoName,
    org: org,
    date: event.created_at,
    author: event.actor?.login,
    avatarUrl: event.actor?.avatar_url,
    eventId: event.id,
  }
  
  const payload = event.payload || {}
  
  switch (event.type) {
    case 'PushEvent':
      const pushBranch = payload.ref?.replace('refs/heads/', '')
      const pushCommits = payload.commits || []
      const firstCommit = pushCommits[0]
      const pushSize = payload.size || pushCommits.length || 0
      const headSha = payload.head
      const beforeSha = payload.before
      
      // Build proper message: show first commit message or fallback
      let pushMessage = `Push to ${pushBranch}`
      if (firstCommit?.message) {
        pushMessage = firstCommit.message.split('\n')[0]
      } else if (pushSize > 0) {
        pushMessage = `${pushSize} commit${pushSize > 1 ? 's' : ''} to ${pushBranch}`
      }
      
      // Build proper URL
      let pushUrl = `https://github.com/${org}/${repoName}/tree/${pushBranch}`
      if (headSha) {
        pushUrl = `https://github.com/${org}/${repoName}/commit/${headSha}`
      }
      if (pushSize > 1 && beforeSha && headSha && beforeSha !== '0000000000000000000000000000000000000000') {
        pushUrl = `https://github.com/${org}/${repoName}/compare/${beforeSha.substring(0, 7)}...${headSha.substring(0, 7)}`
      }
      
      return {
        ...base,
        type: ACTIVITY_TYPES.PUSH,
        message: pushMessage,
        fullMessage: pushSize > 1 ? `${pushSize} commits to ${pushBranch}` : null,
        branch: pushBranch,
        url: pushUrl,
        sha: headSha,
        shortSha: headSha?.substring(0, 7),
        beforeSha: beforeSha,
        commits: pushCommits.map(c => ({
          sha: c.sha,
          shortSha: c.sha?.substring(0, 7),
          message: c.message,
          author: c.author?.name || c.author?.email,
          url: `https://github.com/${org}/${repoName}/commit/${c.sha}`,
        })),
        commitCount: pushSize,
        // Store ref info for fetching more details
        ref: payload.ref,
        distinctSize: payload.distinct_size,
      }
      
    case 'PullRequestEvent':
      const pr = payload.pull_request
      const prAction = payload.action
      let prType = ACTIVITY_TYPES.PR_OPENED
      if (prAction === 'closed' && pr?.merged) prType = ACTIVITY_TYPES.PR_MERGED
      else if (prAction === 'closed') prType = ACTIVITY_TYPES.PR_CLOSED
      else if (prAction === 'reopened') prType = ACTIVITY_TYPES.PR_REOPENED
      
      return {
        ...base,
        type: prType,
        message: pr?.title,
        body: pr?.body,
        number: pr?.number,
        url: pr?.html_url,
        state: pr?.merged ? 'merged' : pr?.state,
        additions: pr?.additions,
        deletions: pr?.deletions,
        changedFiles: pr?.changed_files,
        labels: pr?.labels?.map(l => ({ name: l.name, color: l.color })),
        action: prAction,
      }
      
    case 'PullRequestReviewEvent':
      const review = payload.review
      let reviewType = ACTIVITY_TYPES.REVIEW_COMMENTED
      if (review?.state === 'approved') reviewType = ACTIVITY_TYPES.REVIEW_APPROVED
      else if (review?.state === 'changes_requested') reviewType = ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED
      
      return {
        ...base,
        type: reviewType,
        message: `${review?.state === 'approved' ? 'Approved' : review?.state === 'changes_requested' ? 'Requested changes on' : 'Reviewed'} PR #${payload.pull_request?.number}: ${payload.pull_request?.title}`,
        body: review?.body,
        number: payload.pull_request?.number,
        url: review?.html_url || payload.pull_request?.html_url,
        reviewState: review?.state,
        prTitle: payload.pull_request?.title,
        prAuthor: payload.pull_request?.user?.login,
      }
      
    case 'PullRequestReviewCommentEvent':
      return {
        ...base,
        type: ACTIVITY_TYPES.REVIEW_COMMENT,
        message: `Commented on PR #${payload.pull_request?.number} review`,
        body: payload.comment?.body,
        number: payload.pull_request?.number,
        url: payload.comment?.html_url,
        prTitle: payload.pull_request?.title,
        diffHunk: payload.comment?.diff_hunk,
        path: payload.comment?.path,
        line: payload.comment?.line,
      }
      
    case 'IssueCommentEvent':
      const isPR = !!payload.issue?.pull_request
      return {
        ...base,
        type: isPR ? ACTIVITY_TYPES.PR_COMMENT : ACTIVITY_TYPES.ISSUE_COMMENT,
        message: `Commented on ${isPR ? 'PR' : 'issue'} #${payload.issue?.number}: ${payload.issue?.title}`,
        body: payload.comment?.body,
        number: payload.issue?.number,
        url: payload.comment?.html_url,
        issueTitle: payload.issue?.title,
      }
      
    case 'CommitCommentEvent':
      return {
        ...base,
        type: ACTIVITY_TYPES.COMMIT_COMMENT,
        message: `Commented on commit ${payload.comment?.commit_id?.substring(0, 7)}`,
        body: payload.comment?.body,
        url: payload.comment?.html_url,
        commitId: payload.comment?.commit_id,
        path: payload.comment?.path,
        line: payload.comment?.line,
      }
      
    case 'CreateEvent':
      if (payload.ref_type === 'branch') {
        return {
          ...base,
          type: ACTIVITY_TYPES.BRANCH_CREATED,
          message: `Created branch: ${payload.ref}`,
          branch: payload.ref,
          url: `https://github.com/${org}/${repoName}/tree/${payload.ref}`,
        }
      } else if (payload.ref_type === 'tag') {
        return {
          ...base,
          type: ACTIVITY_TYPES.TAG_CREATED,
          message: `Created tag: ${payload.ref}`,
          tagName: payload.ref,
          url: `https://github.com/${org}/${repoName}/releases/tag/${payload.ref}`,
        }
      }
      return null
      
    case 'DeleteEvent':
      if (payload.ref_type === 'branch') {
        return {
          ...base,
          type: ACTIVITY_TYPES.BRANCH_DELETED,
          message: `Deleted branch: ${payload.ref}`,
          branch: payload.ref,
          url: `https://github.com/${org}/${repoName}/branches`,
        }
      } else if (payload.ref_type === 'tag') {
        return {
          ...base,
          type: ACTIVITY_TYPES.TAG_DELETED,
          message: `Deleted tag: ${payload.ref}`,
          tagName: payload.ref,
          url: `https://github.com/${org}/${repoName}/tags`,
        }
      }
      return null
      
    case 'ReleaseEvent':
      return {
        ...base,
        type: ACTIVITY_TYPES.RELEASE_PUBLISHED,
        message: `Released: ${payload.release?.name || payload.release?.tag_name}`,
        url: payload.release?.html_url,
        tagName: payload.release?.tag_name,
        releaseName: payload.release?.name,
        body: payload.release?.body,
        prerelease: payload.release?.prerelease,
        draft: payload.release?.draft,
      }
      
    case 'IssuesEvent':
      let issueType = ACTIVITY_TYPES.ISSUE_OPENED
      if (payload.action === 'closed') issueType = ACTIVITY_TYPES.ISSUE_CLOSED
      else if (payload.action === 'reopened') issueType = ACTIVITY_TYPES.ISSUE_REOPENED
      
      return {
        ...base,
        type: issueType,
        message: `${payload.action === 'opened' ? 'Opened' : payload.action === 'closed' ? 'Closed' : 'Updated'} issue #${payload.issue?.number}: ${payload.issue?.title}`,
        number: payload.issue?.number,
        url: payload.issue?.html_url,
        body: payload.issue?.body,
        labels: payload.issue?.labels?.map(l => ({ name: l.name, color: l.color })),
        action: payload.action,
      }
      
    case 'ForkEvent':
      return {
        ...base,
        type: ACTIVITY_TYPES.REPO_FORKED,
        message: `Forked repository to ${payload.forkee?.full_name}`,
        url: payload.forkee?.html_url,
        forkName: payload.forkee?.full_name,
      }
      
    case 'WatchEvent':
      return {
        ...base,
        type: ACTIVITY_TYPES.REPO_STARRED,
        message: `Starred the repository`,
      }
      
    default:
      return null
  }
}

// ============ FETCH USER EVENTS (All user activity) ============
export async function fetchUserEvents(token, username) {
  const activities = []
  
  try {
    // Try user events first (works best for authenticated user)
    const events = await fetchWithAuth(
      `${GITHUB_API_BASE}/users/${username}/events?per_page=100`,
      token
    )
    
    if (events && events.length > 0) {
      for (const event of events) {
        const repoName = event.repo?.name?.split('/')[1] || 'unknown'
        const org = event.repo?.name?.split('/')[0] || 'unknown'
        const activity = parseGitHubEvent(event, org, repoName)
        if (activity) activities.push(activity)
      }
    }
    
    // Also try public events if user events didn't return much
    if (events?.length < 10) {
      const publicEvents = await fetchWithAuth(
        `${GITHUB_API_BASE}/users/${username}/events/public?per_page=100`,
        token
      )
      
      if (publicEvents) {
        for (const event of publicEvents) {
          const repoName = event.repo?.name?.split('/')[1] || 'unknown'
          const org = event.repo?.name?.split('/')[0] || 'unknown'
          const activity = parseGitHubEvent(event, org, repoName)
          if (activity && !activities.find(a => a.id === activity.id)) {
            activities.push(activity)
          }
        }
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch events for ${username}:`, e)
  }
  
  return activities
}

// ============ FETCH USER ACTIVITIES FROM ORG REPOS ============
// More comprehensive - searches through org repos for user's activities
export async function fetchUserActivitiesInOrg(token, org, username, repos) {
  const activities = []
  
  // First try user events
  try {
    const events = await fetchWithAuth(
      `${GITHUB_API_BASE}/users/${username}/events?per_page=100`,
      token
    )
    
    if (events) {
      for (const event of events) {
        const repoName = event.repo?.name?.split('/')[1] || 'unknown'
        const eventOrg = event.repo?.name?.split('/')[0] || 'unknown'
        const activity = parseGitHubEvent(event, eventOrg, repoName)
        if (activity) activities.push(activity)
      }
    }
  } catch (e) { /* continue */ }
  
  // If not enough from events API, search through repos
  if (activities.length < 20 && repos && repos.length > 0) {
    const reposToCheck = repos.slice(0, 10) // Limit to 10 repos for speed
    
    for (const repo of reposToCheck) {
      const repoName = typeof repo === 'string' ? repo : repo.name
      
      // Get commits by user
      try {
        const commits = await fetchWithAuth(
          `${GITHUB_API_BASE}/repos/${org}/${repoName}/commits?author=${username}&per_page=30`,
          token
        )
        if (commits) {
          for (const commit of commits) {
            const exists = activities.find(a => a.sha === commit.sha)
            if (!exists) {
              activities.push({
                id: `${repoName}-commit-${commit.sha}`,
                type: ACTIVITY_TYPES.COMMIT,
                repo: repoName,
                repoFullName: `${org}/${repoName}`,
                message: commit.commit.message.split('\n')[0],
                fullMessage: commit.commit.message,
                date: commit.commit.author?.date || commit.commit.committer?.date,
                sha: commit.sha,
                shortSha: commit.sha.substring(0, 7),
                url: commit.html_url,
                author: username,
                avatarUrl: commit.author?.avatar_url,
              })
            }
          }
        }
      } catch (e) { /* continue */ }
      
      // Get PRs by user
      try {
        const prs = await fetchWithAuth(
          `${GITHUB_API_BASE}/repos/${org}/${repoName}/pulls?state=all&creator=${username}&per_page=20`,
          token
        )
        if (prs) {
          for (const pr of prs) {
            const exists = activities.find(a => a.number === pr.number && a.type?.includes('pr'))
            if (!exists) {
              activities.push({
                id: `${repoName}-pr-${pr.id}`,
                type: pr.merged_at ? ACTIVITY_TYPES.PR_MERGED : pr.state === 'open' ? ACTIVITY_TYPES.PR_OPENED : ACTIVITY_TYPES.PR_CLOSED,
                repo: repoName,
                repoFullName: `${org}/${repoName}`,
                message: pr.title,
                body: pr.body,
                date: pr.created_at,
                mergedAt: pr.merged_at,
                number: pr.number,
                url: pr.html_url,
                state: pr.merged_at ? 'merged' : pr.state,
                author: username,
                avatarUrl: pr.user?.avatar_url,
                additions: pr.additions,
                deletions: pr.deletions,
                labels: pr.labels?.map(l => ({ name: l.name, color: l.color })),
              })
            }
          }
        }
      } catch (e) { /* continue */ }
    }
  }
  
  // Sort by date
  activities.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  return activities
}

// ============ FETCH TEAM MEMBER ACTIVITIES - SEQUENTIAL WITH RATE LIMIT HANDLING ============
// Uses GitHub Search API but processes ONE member at a time to avoid rate limits
export async function fetchTeamMemberActivitiesFromOrgRepos(token, org, repos, memberLogins, onProgress) {
  const activities = []
  const totalMembers = memberLogins.length
  
  // Process members ONE AT A TIME to avoid rate limits
  for (let i = 0; i < memberLogins.length; i++) {
    const username = memberLogins[i]
    
    onProgress?.({
      status: `Loading ${username}... (${i + 1}/${totalMembers})`,
      percentage: Math.round((i / totalMembers) * 100)
    })
    
    // 1. Search COMMITS by author
    try {
      const commitResponse = await fetch(
        `${GITHUB_API_BASE}/search/commits?q=author:${username}+org:${org}&sort=committer-date&order=desc&per_page=30`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.cloak-preview+json',
            'User-Agent': 'GitPulse-Dashboard',
          },
        }
      )
      
      if (commitResponse.ok) {
        const data = await commitResponse.json()
        for (const commit of (data.items || [])) {
          activities.push({
            id: `${commit.repository.full_name}-commit-${commit.sha}`,
            type: ACTIVITY_TYPES.COMMIT,
            repo: commit.repository.full_name,
            repoShort: commit.repository.name,
            message: commit.commit?.message?.split('\n')[0] || 'No message',
            fullMessage: commit.commit?.message,
            date: commit.commit?.committer?.date || commit.commit?.author?.date,
            sha: commit.sha,
            shortSha: commit.sha?.substring(0, 7),
            url: commit.html_url,
            author: commit.author?.login || commit.commit?.author?.name || username,
            avatarUrl: commit.author?.avatar_url,
          })
        }
      } else if (commitResponse.status === 403) {
        // Rate limited - wait and retry once
        await new Promise(r => setTimeout(r, 2000))
        const retryResponse = await fetch(
          `${GITHUB_API_BASE}/search/commits?q=author:${username}+org:${org}&sort=committer-date&order=desc&per_page=30`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.cloak-preview+json',
              'User-Agent': 'GitPulse-Dashboard',
            },
          }
        )
        if (retryResponse.ok) {
          const data = await retryResponse.json()
          for (const commit of (data.items || [])) {
            activities.push({
              id: `${commit.repository.full_name}-commit-${commit.sha}`,
              type: ACTIVITY_TYPES.COMMIT,
              repo: commit.repository.full_name,
              repoShort: commit.repository.name,
              message: commit.commit?.message?.split('\n')[0] || 'No message',
              date: commit.commit?.committer?.date,
              sha: commit.sha,
              shortSha: commit.sha?.substring(0, 7),
              url: commit.html_url,
              author: commit.author?.login || username,
              avatarUrl: commit.author?.avatar_url,
            })
          }
        }
      }
    } catch (e) { /* continue */ }
    
    // Wait between API calls to respect rate limits
    await new Promise(r => setTimeout(r, 500))
    
    // 2. Search PRs by author
    try {
      const prResponse = await fetch(
        `${GITHUB_API_BASE}/search/issues?q=author:${username}+org:${org}+is:pr&sort=created&order=desc&per_page=30`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitPulse-Dashboard',
          },
        }
      )
      
      if (prResponse.ok) {
        const data = await prResponse.json()
        for (const pr of (data.items || [])) {
          const repoFullName = pr.repository_url?.replace('https://api.github.com/repos/', '') || ''
          const repoName = repoFullName.split('/')[1] || ''
          
          activities.push({
            id: `${repoFullName}-pr-${pr.id}`,
            type: pr.pull_request?.merged_at ? ACTIVITY_TYPES.PR_MERGED : 
                  pr.state === 'open' ? ACTIVITY_TYPES.PR_OPENED : ACTIVITY_TYPES.PR_CLOSED,
            repo: repoFullName,
            repoShort: repoName,
            message: pr.title,
            body: pr.body,
            date: pr.created_at,
            number: pr.number,
            url: pr.html_url,
            state: pr.pull_request?.merged_at ? 'merged' : pr.state,
            author: pr.user?.login || username,
            avatarUrl: pr.user?.avatar_url,
            labels: pr.labels?.map(l => ({ name: l.name, color: l.color })),
          })
        }
      }
    } catch (e) { /* continue */ }
    
    // Wait between members
    await new Promise(r => setTimeout(r, 300))
  }
  
  onProgress?.({
    status: 'Sorting and deduplicating...',
    percentage: 95
  })
  
  // Sort and deduplicate
  activities.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  const seen = new Set()
  const unique = activities.filter(a => {
    const key = a.id || `${a.type}-${a.repo}-${a.date}-${a.author}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  
  onProgress?.({ status: 'Complete!', percentage: 100 })
  
  return unique
}

// ============ FETCH COMPREHENSIVE REPO ACTIVITIES ============
export async function fetchComprehensiveRepoActivities(token, org, repoName, onProgress) {
  const activities = []
  const stats = {}
  
  onProgress?.({ status: `Loading ${repoName} events...`, percentage: 10 })
  
  // 1. Fetch repo events (most comprehensive)
  const events = await fetchRepoEvents(token, org, repoName)
  activities.push(...events)
  
  onProgress?.({ status: `Loading ${repoName} commits...`, percentage: 30 })
  
  // 2. Fetch commits (more detail than events)
  try {
    const commits = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/commits?per_page=100`,
      token
    )
    if (commits) {
      for (const commit of commits) {
        // Check if not already in events
        const exists = activities.some(a => a.sha === commit.sha)
        if (!exists) {
          activities.push({
            id: `${repoName}-commit-${commit.sha}`,
            type: ACTIVITY_TYPES.COMMIT,
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
    }
  } catch (e) { /* continue */ }
  
  onProgress?.({ status: `Loading ${repoName} PRs...`, percentage: 50 })
  
  // 3. Fetch PRs with more details
  try {
    const prs = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
      token
    )
    if (prs) {
      for (const pr of prs) {
        const exists = activities.some(a => a.number === pr.number && a.type?.startsWith('pr_'))
        if (!exists) {
          activities.push({
            id: `${repoName}-pr-${pr.id}`,
            type: pr.merged_at ? ACTIVITY_TYPES.PR_MERGED : pr.state === 'open' ? ACTIVITY_TYPES.PR_OPENED : ACTIVITY_TYPES.PR_CLOSED,
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
            additions: pr.additions,
            deletions: pr.deletions,
            changedFiles: pr.changed_files,
            labels: pr.labels?.map(l => ({ name: l.name, color: l.color })),
          })
        }
      }
    }
  } catch (e) { /* continue */ }
  
  onProgress?.({ status: `Loading ${repoName} reviews...`, percentage: 70 })
  
  // 4. Fetch reviews for recent PRs
  try {
    const prs = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/pulls?state=all&per_page=20`,
      token
    )
    if (prs) {
      for (const pr of prs.slice(0, 10)) {
        try {
          const reviews = await fetchWithAuth(
            `${GITHUB_API_BASE}/repos/${org}/${repoName}/pulls/${pr.number}/reviews`,
            token
          )
          if (reviews) {
            for (const review of reviews) {
              const exists = activities.some(a => a.id?.includes(`review-${review.id}`))
              if (!exists) {
                let reviewType = ACTIVITY_TYPES.REVIEW_COMMENTED
                if (review.state === 'APPROVED') reviewType = ACTIVITY_TYPES.REVIEW_APPROVED
                else if (review.state === 'CHANGES_REQUESTED') reviewType = ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED
                
                activities.push({
                  id: `${repoName}-review-${review.id}`,
                  type: reviewType,
                  repo: repoName,
                  repoFullName: `${org}/${repoName}`,
                  message: `${review.state === 'APPROVED' ? 'Approved' : review.state === 'CHANGES_REQUESTED' ? 'Requested changes on' : 'Reviewed'} PR #${pr.number}: ${pr.title}`,
                  body: review.body,
                  date: review.submitted_at,
                  number: pr.number,
                  url: review.html_url || pr.html_url,
                  author: review.user?.login,
                  avatarUrl: review.user?.avatar_url,
                  reviewState: review.state,
                  prTitle: pr.title,
                  prAuthor: pr.user?.login,
                })
              }
            }
          }
        } catch (e) { /* continue */ }
      }
    }
  } catch (e) { /* continue */ }
  
  onProgress?.({ status: `Loading ${repoName} comments...`, percentage: 85 })
  
  // 5. Fetch issue/PR comments
  try {
    const comments = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/issues/comments?sort=created&direction=desc&per_page=50`,
      token
    )
    if (comments) {
      for (const comment of comments) {
        const exists = activities.some(a => a.id?.includes(`comment-${comment.id}`))
        if (!exists) {
          const issueNumber = comment.issue_url.split('/').pop()
          activities.push({
            id: `${repoName}-comment-${comment.id}`,
            type: ACTIVITY_TYPES.PR_COMMENT,
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
    }
  } catch (e) { /* continue */ }
  
  // 6. Fetch releases
  try {
    const releases = await fetchWithAuth(
      `${GITHUB_API_BASE}/repos/${org}/${repoName}/releases?per_page=20`,
      token
    )
    if (releases) {
      for (const release of releases) {
        const exists = activities.some(a => a.tagName === release.tag_name && a.type === ACTIVITY_TYPES.RELEASE_PUBLISHED)
        if (!exists) {
          activities.push({
            id: `${repoName}-release-${release.id}`,
            type: ACTIVITY_TYPES.RELEASE_PUBLISHED,
            repo: repoName,
            repoFullName: `${org}/${repoName}`,
            message: `Released: ${release.name || release.tag_name}`,
            url: release.html_url,
            date: release.published_at || release.created_at,
            author: release.author?.login,
            avatarUrl: release.author?.avatar_url,
            tagName: release.tag_name,
            releaseName: release.name,
            body: release.body,
          })
        }
      }
    }
  } catch (e) { /* continue */ }
  
  // Sort by date and dedupe
  activities.sort((a, b) => new Date(b.date) - new Date(a.date))
  const seen = new Set()
  const unique = activities.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })
  
  onProgress?.({ status: 'Complete!', percentage: 100 })
  
  return unique
}

// ============ CALCULATE STATS FROM ACTIVITIES ============
export function calculateStatsFromActivities(activities) {
  const statsByAuthor = {}
  const lastActiveByAuthor = {}
  
  for (const activity of activities) {
    const author = activity.author
    if (!author || author === 'unknown') continue
    
    if (!statsByAuthor[author]) {
      statsByAuthor[author] = {
        login: author,
        avatarUrl: activity.avatarUrl,
        commits: 0,
        prs: 0,
        reviews: 0,
        comments: 0,
        approvals: 0,
        merges: 0,
        branches: 0,
        tags: 0,
        releases: 0,
        issues: 0,
        linesAdded: 0,
        linesRemoved: 0,
        reposActive: new Set(),
      }
    }
    
    const s = statsByAuthor[author]
    s.reposActive.add(activity.repo)
    
    // Update last active
    const activityDate = new Date(activity.date)
    if (!lastActiveByAuthor[author] || activityDate > lastActiveByAuthor[author]) {
      lastActiveByAuthor[author] = activityDate
    }
    
    // Count by type
    switch (activity.type) {
      case ACTIVITY_TYPES.COMMIT:
      case ACTIVITY_TYPES.PUSH:
        s.commits += activity.commitCount || 1
        s.linesAdded += activity.stats?.additions || activity.additions || 0
        s.linesRemoved += activity.stats?.deletions || activity.deletions || 0
        break
      case ACTIVITY_TYPES.PR_OPENED:
        s.prs++
        break
      case ACTIVITY_TYPES.PR_MERGED:
        s.merges++
        break
      case ACTIVITY_TYPES.REVIEW_APPROVED:
        s.reviews++
        s.approvals++
        break
      case ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED:
      case ACTIVITY_TYPES.REVIEW_COMMENTED:
        s.reviews++
        break
      case ACTIVITY_TYPES.PR_COMMENT:
      case ACTIVITY_TYPES.ISSUE_COMMENT:
      case ACTIVITY_TYPES.COMMIT_COMMENT:
      case ACTIVITY_TYPES.REVIEW_COMMENT:
        s.comments++
        break
      case ACTIVITY_TYPES.BRANCH_CREATED:
      case ACTIVITY_TYPES.BRANCH_DELETED:
        s.branches++
        break
      case ACTIVITY_TYPES.TAG_CREATED:
      case ACTIVITY_TYPES.TAG_DELETED:
        s.tags++
        break
      case ACTIVITY_TYPES.RELEASE_PUBLISHED:
        s.releases++
        break
      case ACTIVITY_TYPES.ISSUE_OPENED:
      case ACTIVITY_TYPES.ISSUE_CLOSED:
        s.issues++
        break
    }
  }
  
  // Calculate inactive status (6+ months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  return Object.values(statsByAuthor).map(s => ({
    ...s,
    reposActive: s.reposActive.size,
    total: s.commits + s.prs + s.reviews + s.comments + s.merges,
    lastActive: lastActiveByAuthor[s.login],
    isInactive: lastActiveByAuthor[s.login] ? lastActiveByAuthor[s.login] < sixMonthsAgo : true,
  })).sort((a, b) => b.total - a.total)
}

