/**
 * Enhanced Activity Feed Component
 * Simplified cards - commits inline, PRs link properly
 */

import { useState, useMemo } from 'react'
import { 
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, ExternalLink,
  CheckCircle, XCircle, AlertCircle, GitBranch, Tag, Rocket, Clock,
  MessageCircle, Trash2, Upload, GitFork, Activity, Loader2,
  Maximize2, Minimize2, ChevronDown, ChevronUp, Search, Plus, Minus, 
  Code2, FolderOpen, Hash, Layers
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ACTIVITY_TYPES, fetchCommitDetails } from '../../api/github/activities'

// ============ ACTIVITY TYPE STYLES ============
const ACTIVITY_STYLES = {
  [ACTIVITY_TYPES.COMMIT]: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  [ACTIVITY_TYPES.PUSH]: {
    border: 'border-l-green-500',
    bg: 'bg-green-500/10',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
  },
  [ACTIVITY_TYPES.PR_OPENED]: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-500/10',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
  },
  [ACTIVITY_TYPES.PR_MERGED]: {
    border: 'border-l-fuchsia-500',
    bg: 'bg-fuchsia-500/10',
    iconBg: 'bg-fuchsia-500/20',
    iconColor: 'text-fuchsia-400',
  },
  [ACTIVITY_TYPES.PR_CLOSED]: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-500/10',
    iconBg: 'bg-gray-500/20',
    iconColor: 'text-gray-400',
  },
  [ACTIVITY_TYPES.REVIEW_APPROVED]: {
    border: 'border-l-teal-400',
    bg: 'bg-teal-500/10',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
  },
  [ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED]: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/10',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
  },
  [ACTIVITY_TYPES.REVIEW_COMMENTED]: {
    border: 'border-l-cyan-400',
    bg: 'bg-cyan-500/10',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
  [ACTIVITY_TYPES.PR_COMMENT]: {
    border: 'border-l-blue-400',
    bg: 'bg-blue-500/10',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
  [ACTIVITY_TYPES.ISSUE_COMMENT]: {
    border: 'border-l-indigo-400',
    bg: 'bg-indigo-500/10',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
  },
  [ACTIVITY_TYPES.BRANCH_CREATED]: {
    border: 'border-l-teal-500',
    bg: 'bg-teal-500/10',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
  },
  [ACTIVITY_TYPES.BRANCH_DELETED]: {
    border: 'border-l-red-400',
    bg: 'bg-red-500/10',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
  },
  [ACTIVITY_TYPES.TAG_CREATED]: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-500/10',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
  },
}

const DEFAULT_STYLE = {
  border: 'border-l-electric-400',
  bg: 'bg-electric-400/10',
  iconBg: 'bg-electric-400/20',
  iconColor: 'text-electric-400',
}

const ACTIVITY_LABELS = {
  [ACTIVITY_TYPES.COMMIT]: 'Commit',
  [ACTIVITY_TYPES.PUSH]: 'Push',
  [ACTIVITY_TYPES.PR_OPENED]: 'PR Opened',
  [ACTIVITY_TYPES.PR_MERGED]: 'PR Merged',
  [ACTIVITY_TYPES.PR_CLOSED]: 'PR Closed',
  [ACTIVITY_TYPES.REVIEW_APPROVED]: 'Approved',
  [ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED]: 'Changes Requested',
  [ACTIVITY_TYPES.REVIEW_COMMENTED]: 'Review',
  [ACTIVITY_TYPES.PR_COMMENT]: 'Comment',
  [ACTIVITY_TYPES.ISSUE_COMMENT]: 'Comment',
  [ACTIVITY_TYPES.BRANCH_CREATED]: 'Branch',
  [ACTIVITY_TYPES.BRANCH_DELETED]: 'Deleted',
  [ACTIVITY_TYPES.TAG_CREATED]: 'Tag',
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: 'Release',
}

const ICONS = {
  [ACTIVITY_TYPES.COMMIT]: GitCommit,
  [ACTIVITY_TYPES.PUSH]: GitCommit, // Show commit icon for push
  [ACTIVITY_TYPES.PR_OPENED]: GitPullRequest,
  [ACTIVITY_TYPES.PR_MERGED]: GitMerge,
  [ACTIVITY_TYPES.PR_CLOSED]: XCircle,
  [ACTIVITY_TYPES.REVIEW_APPROVED]: CheckCircle,
  [ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED]: AlertCircle,
  [ACTIVITY_TYPES.REVIEW_COMMENTED]: Eye,
  [ACTIVITY_TYPES.PR_COMMENT]: MessageSquare,
  [ACTIVITY_TYPES.ISSUE_COMMENT]: MessageCircle,
  [ACTIVITY_TYPES.BRANCH_CREATED]: GitBranch,
  [ACTIVITY_TYPES.BRANCH_DELETED]: Trash2,
  [ACTIVITY_TYPES.TAG_CREATED]: Tag,
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: Rocket,
}

// ============ SIMPLIFIED ACTIVITY CARD ============
function ActivityCard({ activity, onMemberClick, token }) {
  const [showMoreCommits, setShowMoreCommits] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [commitDetails, setCommitDetails] = useState(null)
  
  const style = ACTIVITY_STYLES[activity.type] || DEFAULT_STYLE
  const Icon = ICONS[activity.type] || Activity
  const label = ACTIVITY_LABELS[activity.type] || 'Activity'
  
  const isPush = activity.type === ACTIVITY_TYPES.PUSH
  const isPR = [ACTIVITY_TYPES.PR_OPENED, ACTIVITY_TYPES.PR_MERGED, ACTIVITY_TYPES.PR_CLOSED].includes(activity.type)
  const commits = activity.commits || []
  const hasMultipleCommits = commits.length > 1 || (activity.commitCount && activity.commitCount > 1)
  
  // For single commit push, show commit directly
  const singleCommit = isPush && commits.length === 1 ? commits[0] : null
  const displaySha = singleCommit?.sha || activity.sha || activity.shortSha
  
  // Get the URL to link to
  const getUrl = () => {
    // PR - link to the PR page
    if (isPR && activity.url) return activity.url
    if (isPR && activity.number) return `https://github.com/${activity.repo}/pull/${activity.number}`
    
    // Push/Commit - link to the commit
    if (isPush && singleCommit?.sha) return `https://github.com/${activity.repo}/commit/${singleCommit.sha}`
    if (isPush && activity.sha) return `https://github.com/${activity.repo}/commit/${activity.sha}`
    
    // Default
    if (activity.url) return activity.url
    return `https://github.com/${activity.repo}`
  }
  
  // Get the commit message to display
  const getMessage = () => {
    if (isPush && singleCommit?.message) return singleCommit.message.split('\n')[0]
    if (isPush && commits[0]?.message) return commits[0].message.split('\n')[0]
    return activity.message
  }
  
  // Load commit details on demand
  const loadCommitDetails = async () => {
    if (!token || !displaySha || commitDetails) return
    setLoadingDetails(true)
    try {
      const [repoOrg, repoName] = activity.repo?.split('/') || []
      if (repoOrg && repoName) {
        const details = await fetchCommitDetails(token, repoOrg, repoName, displaySha)
        if (details) setCommitDetails(details)
      }
    } catch (e) {
      console.warn('Failed to load commit details:', e)
    }
    setLoadingDetails(false)
  }
  
  const additions = commitDetails?.additions ?? activity.additions
  const deletions = commitDetails?.deletions ?? activity.deletions
  const files = commitDetails?.changedFiles ?? activity.changedFiles
  
  return (
    <a 
      href={getUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`block group rounded-2xl overflow-hidden border-l-4 ${style.border} bg-void-800/70 hover:bg-void-800 transition-all duration-200`}
    >
      {/* Header */}
      <div className={`${style.bg} px-4 py-3 border-b border-void-600/30`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Icon */}
          <div className={`p-2 ${style.iconBg} rounded-lg`}>
            <Icon className={`w-4 h-4 ${style.iconColor}`} />
          </div>
          
          {/* Author */}
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMemberClick?.(activity.author) }}
            className="flex items-center gap-2 hover:opacity-80"
          >
            {activity.avatarUrl && <img src={activity.avatarUrl} alt="" className="w-6 h-6 rounded-full" />}
            <span className="font-semibold text-frost-100 text-sm">{activity.author}</span>
          </button>
          
          <span className="text-frost-300/30">→</span>
          
          {/* Repo */}
          <span className="px-2 py-1 bg-yellow-400/15 text-yellow-400 rounded-lg text-xs font-medium">
            {activity.repoShort || activity.repo?.split('/')[1] || activity.repo}
          </span>
          
          {/* Type Badge */}
          <span className={`px-2 py-1 ${style.iconBg} ${style.iconColor} rounded-lg text-xs font-bold`}>
            {label}
          </span>
          
          {/* PR Number */}
          {activity.number && <span className="text-sm text-frost-300/60">#{activity.number}</span>}
          
          {/* Status */}
          {activity.state === 'merged' && (
            <span className="px-2 py-0.5 bg-fuchsia-500/25 text-fuchsia-400 rounded text-xs font-bold">MERGED</span>
          )}
          
          {/* Time */}
          <span className="ml-auto text-xs text-frost-300/40 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
          </span>
          
          <ExternalLink className="w-3.5 h-3.5 text-frost-300/30 group-hover:text-frost-200" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Message */}
        <p className="text-frost-100 font-medium mb-3 group-hover:text-white">
          {getMessage()}
        </p>
        
        {/* Commit Info (for push/commit) */}
        {(isPush || activity.type === ACTIVITY_TYPES.COMMIT) && displaySha && (
          <div className="flex items-center gap-3 flex-wrap mb-3">
            {/* SHA */}
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              <code className="text-sm font-mono text-emerald-400">{displaySha.substring(0, 7)}</code>
            </div>
            
            {/* Branch */}
            {activity.branch && (
              <div className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                <GitBranch className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-sm text-teal-400">{activity.branch}</span>
              </div>
            )}
            
            {/* Lines Changed */}
            {(additions !== undefined || deletions !== undefined) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-void-700/50 border border-void-600/30 rounded-lg">
                <Code2 className="w-3.5 h-3.5 text-frost-300/50" />
                {additions > 0 && <span className="text-sm text-emerald-400">+{additions}</span>}
                {deletions > 0 && <span className="text-sm text-red-400">-{deletions}</span>}
              </div>
            )}
            
            {/* Files */}
            {files > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-sm text-purple-400">{files} files</span>
              </div>
            )}
            
            {/* Load Details Button */}
            {!commitDetails && token && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadCommitDetails() }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-frost-300/40 hover:text-frost-200 transition-colors"
              >
                {loadingDetails ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {loadingDetails ? 'Loading...' : 'Load details'}
              </button>
            )}
          </div>
        )}
        
        {/* Multiple Commits Dropdown */}
        {hasMultipleCommits && (
          <div className="mt-2">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMoreCommits(!showMoreCommits) }}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300"
            >
              <Layers className="w-4 h-4" />
              {commits.length || activity.commitCount} commits
              {showMoreCommits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showMoreCommits && commits.length > 0 && (
              <div className="mt-2 space-y-1 pl-2 border-l-2 border-emerald-500/30">
                {commits.map((c, i) => (
                  <a
                    key={c.sha || i}
                    href={c.url || `https://github.com/${activity.repo}/commit/${c.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 py-1.5 px-2 hover:bg-void-700/50 rounded-lg group/commit"
                  >
                    <GitCommit className="w-3 h-3 text-emerald-400" />
                    <code className="text-xs text-emerald-400 font-mono">{c.sha?.substring(0, 7)}</code>
                    <span className="text-xs text-frost-300/70 truncate flex-1">{c.message?.split('\n')[0]}</span>
                    <ExternalLink className="w-3 h-3 text-frost-300/20 group-hover/commit:text-emerald-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* PR Info (lines/files) */}
        {isPR && (additions !== undefined || deletions !== undefined) && (
          <div className="flex items-center gap-3 flex-wrap">
            {additions > 0 && (
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                <Plus className="w-3.5 h-3.5" />{additions}
              </span>
            )}
            {deletions > 0 && (
              <span className="flex items-center gap-1 text-sm text-red-400">
                <Minus className="w-3.5 h-3.5" />{deletions}
              </span>
            )}
            {files > 0 && (
              <span className="text-sm text-frost-300/50">{files} files changed</span>
            )}
          </div>
        )}
        
        {/* Body Preview */}
        {activity.body && (
          <p className="mt-2 text-sm text-frost-300/60 italic line-clamp-2 bg-void-700/30 px-3 py-2 rounded-lg">
            "{activity.body.slice(0, 200)}{activity.body.length > 200 ? '...' : ''}"
          </p>
        )}
        
        {/* Branch Info */}
        {activity.type === ACTIVITY_TYPES.BRANCH_CREATED && activity.branch && (
          <div className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg w-fit">
            <GitBranch className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">{activity.branch}</span>
          </div>
        )}
        
        {/* Tag Info */}
        {activity.tagName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg w-fit">
            <Tag className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">{activity.tagName}</span>
          </div>
        )}
      </div>
    </a>
  )
}

// ============ MAIN ACTIVITY FEED ============
export function ActivityFeed({ 
  activities, 
  title = 'Activity Feed',
  onMemberClick,
  maxHeight = '800px',
  showCount = true,
  searchable = true,
  token,
  org,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities
    const q = searchQuery.toLowerCase()
    return activities.filter(a => 
      a.message?.toLowerCase().includes(q) ||
      a.author?.toLowerCase().includes(q) ||
      a.repo?.toLowerCase().includes(q) ||
      a.body?.toLowerCase().includes(q) ||
      a.branch?.toLowerCase().includes(q)
    )
  }, [activities, searchQuery])
  
  const displayCount = showAll ? filteredActivities.length : Math.min(filteredActivities.length, 50)
  
  // Fullscreen view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-void-900/98 backdrop-blur-xl overflow-hidden flex flex-col">
        <div className="flex-shrink-0 p-6 border-b border-void-600/50 bg-void-800/50">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-electric-400/20 rounded-xl">
                <Activity className="w-6 h-6 text-electric-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-frost-100">{title}</h2>
                <p className="text-sm text-frost-300/60">{filteredActivities.length} activities</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search activities..."
                    className="pl-10 pr-4 py-2.5 w-80 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder:text-frost-300/40 focus:outline-none focus:border-electric-400/50 text-sm"
                  />
                </div>
              )}
              
              <button onClick={() => setIsFullscreen(false)} className="p-3 bg-void-700/50 hover:bg-void-600 rounded-xl transition-colors">
                <Minimize2 className="w-5 h-5 text-frost-300" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-3">
            {filteredActivities.map((activity, i) => (
              <ActivityCard key={activity.id || i} activity={activity} onMemberClick={onMemberClick} token={token} />
            ))}
            
            {filteredActivities.length === 0 && (
              <div className="text-center py-20 text-frost-300/50">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No activities found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-void-700/20 border border-void-600/50 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-void-600/30 bg-void-800/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-electric-400/20 rounded-xl">
            <Activity className="w-5 h-5 text-electric-400" />
          </div>
          <h3 className="text-frost-100 font-bold text-lg">{title}</h3>
          {showCount && (
            <span className="text-sm px-3 py-1 bg-void-600/50 rounded-full text-frost-300/60 font-medium">{filteredActivities.length}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-frost-300/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-3 py-1.5 w-48 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 placeholder:text-frost-300/40 focus:outline-none focus:border-electric-400/50 text-xs"
              />
            </div>
          )}
          
          <button onClick={() => setIsFullscreen(true)} className="p-2 bg-void-700/50 hover:bg-void-600 rounded-lg transition-colors" title="Fullscreen">
            <Maximize2 className="w-4 h-4 text-frost-300/60" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight }}>
        {filteredActivities.slice(0, displayCount).map((activity, i) => (
          <ActivityCard key={activity.id || i} activity={activity} onMemberClick={onMemberClick} token={token} />
        ))}
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-16 text-frost-300/50">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No activities found</p>
          </div>
        )}
        
        {filteredActivities.length > 50 && !showAll && (
          <button 
            onClick={() => setShowAll(true)}
            className="w-full py-3 bg-void-700/30 hover:bg-void-700/50 rounded-xl text-frost-300/60 hover:text-frost-200 text-sm transition-colors"
          >
            Load {filteredActivities.length - 50} more activities
          </button>
        )}
      </div>
    </div>
  )
}

export default ActivityFeed
