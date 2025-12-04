/**
 * Enhanced Activity Feed Component
 * Beautiful design with commit details shown by default
 */

import { useState, useMemo, useEffect } from 'react'
import { 
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, ExternalLink,
  CheckCircle, XCircle, AlertCircle, GitBranch, Tag, Rocket, Clock,
  MessageCircle, Trash2, Upload, Activity, Loader2,
  Maximize2, Minimize2, ChevronDown, ChevronUp, Search, Plus, Minus, 
  Code2, FolderOpen, Hash, Layers
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ACTIVITY_TYPES, fetchCommitDetails } from '../../api/github/activities'

// ============ ACTIVITY TYPE STYLES ============
const ACTIVITY_STYLES = {
  [ACTIVITY_TYPES.COMMIT]: {
    border: 'border-l-emerald-500',
    headerBg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400',
  },
  [ACTIVITY_TYPES.PUSH]: {
    border: 'border-l-green-500',
    headerBg: 'bg-gradient-to-r from-green-500/20 to-green-500/5',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    badge: 'bg-green-500/20 text-green-400',
  },
  [ACTIVITY_TYPES.PR_OPENED]: {
    border: 'border-l-purple-500',
    headerBg: 'bg-gradient-to-r from-purple-500/20 to-purple-500/5',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-400',
  },
  [ACTIVITY_TYPES.PR_MERGED]: {
    border: 'border-l-fuchsia-500',
    headerBg: 'bg-gradient-to-r from-fuchsia-500/20 to-fuchsia-500/5',
    iconBg: 'bg-fuchsia-500/20',
    iconColor: 'text-fuchsia-400',
    badge: 'bg-fuchsia-500/20 text-fuchsia-400',
  },
  [ACTIVITY_TYPES.PR_CLOSED]: {
    border: 'border-l-gray-500',
    headerBg: 'bg-gradient-to-r from-gray-500/20 to-gray-500/5',
    iconBg: 'bg-gray-500/20',
    iconColor: 'text-gray-400',
    badge: 'bg-gray-500/20 text-gray-400',
  },
  [ACTIVITY_TYPES.REVIEW_APPROVED]: {
    border: 'border-l-teal-400',
    headerBg: 'bg-gradient-to-r from-teal-500/20 to-teal-500/5',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    badge: 'bg-teal-500/20 text-teal-400',
  },
  [ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED]: {
    border: 'border-l-orange-500',
    headerBg: 'bg-gradient-to-r from-orange-500/20 to-orange-500/5',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-400',
  },
  [ACTIVITY_TYPES.REVIEW_COMMENTED]: {
    border: 'border-l-cyan-400',
    headerBg: 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-400',
  },
  [ACTIVITY_TYPES.PR_COMMENT]: {
    border: 'border-l-blue-400',
    headerBg: 'bg-gradient-to-r from-blue-500/20 to-blue-500/5',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
  },
  [ACTIVITY_TYPES.ISSUE_COMMENT]: {
    border: 'border-l-indigo-400',
    headerBg: 'bg-gradient-to-r from-indigo-500/20 to-indigo-500/5',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-400',
  },
  [ACTIVITY_TYPES.BRANCH_CREATED]: {
    border: 'border-l-teal-500',
    headerBg: 'bg-gradient-to-r from-teal-500/20 to-teal-500/5',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    badge: 'bg-teal-500/20 text-teal-400',
  },
  [ACTIVITY_TYPES.BRANCH_DELETED]: {
    border: 'border-l-red-400',
    headerBg: 'bg-gradient-to-r from-red-500/20 to-red-500/5',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400',
  },
  [ACTIVITY_TYPES.TAG_CREATED]: {
    border: 'border-l-amber-500',
    headerBg: 'bg-gradient-to-r from-amber-500/20 to-amber-500/5',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: {
    border: 'border-l-yellow-500',
    headerBg: 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400',
  },
}

const DEFAULT_STYLE = {
  border: 'border-l-electric-400',
  headerBg: 'bg-gradient-to-r from-electric-400/20 to-electric-400/5',
  iconBg: 'bg-electric-400/20',
  iconColor: 'text-electric-400',
  badge: 'bg-electric-400/20 text-electric-400',
}

const ACTIVITY_LABELS = {
  [ACTIVITY_TYPES.COMMIT]: 'COMMIT',
  [ACTIVITY_TYPES.PUSH]: 'PUSH',
  [ACTIVITY_TYPES.PR_OPENED]: 'PR OPENED',
  [ACTIVITY_TYPES.PR_MERGED]: 'MERGED',
  [ACTIVITY_TYPES.PR_CLOSED]: 'CLOSED',
  [ACTIVITY_TYPES.REVIEW_APPROVED]: 'APPROVED',
  [ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED]: 'CHANGES',
  [ACTIVITY_TYPES.REVIEW_COMMENTED]: 'REVIEW',
  [ACTIVITY_TYPES.PR_COMMENT]: 'COMMENT',
  [ACTIVITY_TYPES.ISSUE_COMMENT]: 'COMMENT',
  [ACTIVITY_TYPES.BRANCH_CREATED]: 'BRANCH',
  [ACTIVITY_TYPES.BRANCH_DELETED]: 'DELETED',
  [ACTIVITY_TYPES.TAG_CREATED]: 'TAG',
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: 'RELEASE',
}

const ICONS = {
  [ACTIVITY_TYPES.COMMIT]: GitCommit,
  [ACTIVITY_TYPES.PUSH]: Upload,
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

// ============ ACTIVITY CARD ============
function ActivityCard({ activity, onMemberClick, token }) {
  const [showCommits, setShowCommits] = useState(false)
  const [commitDetails, setCommitDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  const style = ACTIVITY_STYLES[activity.type] || DEFAULT_STYLE
  const Icon = ICONS[activity.type] || Activity
  const label = ACTIVITY_LABELS[activity.type] || 'ACTIVITY'
  
  const isPush = activity.type === ACTIVITY_TYPES.PUSH
  const isPR = [ACTIVITY_TYPES.PR_OPENED, ACTIVITY_TYPES.PR_MERGED, ACTIVITY_TYPES.PR_CLOSED].includes(activity.type)
  const commits = activity.commits || []
  const hasMultipleCommits = commits.length > 1
  
  const displaySha = commits[0]?.sha || activity.sha
  
  // Auto-load commit details when card mounts (for push events without line info)
  useEffect(() => {
    const shouldFetch = isPush && displaySha && token && 
      activity.additions === undefined && activity.deletions === undefined
    
    if (shouldFetch && !commitDetails && !loadingDetails) {
      setLoadingDetails(true)
      const [repoOrg, repoName] = activity.repo?.split('/') || []
      if (repoOrg && repoName) {
        fetchCommitDetails(token, repoOrg, repoName, displaySha)
          .then(details => {
            if (details) setCommitDetails(details)
          })
          .catch(() => {})
          .finally(() => setLoadingDetails(false))
      } else {
        setLoadingDetails(false)
      }
    }
  }, [activity, displaySha, token, isPush, commitDetails, loadingDetails])
  
  // Get URL
  const getUrl = () => {
    if (isPR && activity.url) return activity.url
    if (isPR && activity.number) return `https://github.com/${activity.repo}/pull/${activity.number}`
    if (displaySha) return `https://github.com/${activity.repo}/commit/${displaySha}`
    if (activity.url) return activity.url
    return `https://github.com/${activity.repo}`
  }
  
  // Get message
  const getMessage = () => {
    if (isPush && commits[0]?.message) return commits[0].message.split('\n')[0]
    return activity.message
  }
  
  // Use commit details or activity data
  const additions = commitDetails?.additions ?? activity.additions
  const deletions = commitDetails?.deletions ?? activity.deletions
  const changedFiles = commitDetails?.changedFiles ?? activity.changedFiles
  
  return (
    <div className={`group relative rounded-2xl overflow-hidden border-l-4 ${style.border} bg-void-800/80 hover:bg-void-800 transition-all duration-300 shadow-lg hover:shadow-xl`}>
      {/* Header */}
      <div className={`${style.headerBg} px-5 py-4 border-b border-void-600/30`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Icon */}
          <div className={`p-2.5 ${style.iconBg} rounded-xl shadow-lg`}>
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          
          {/* Author */}
          <button 
            onClick={() => onMemberClick?.(activity.author)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {activity.avatarUrl && (
              <img src={activity.avatarUrl} alt="" className="w-7 h-7 rounded-full ring-2 ring-void-600" />
            )}
            <span className="font-bold text-frost-100">{activity.author}</span>
          </button>
          
          <span className="text-frost-300/40">→</span>
          
          {/* Repo */}
          <a 
            href={`https://github.com/${activity.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-yellow-400/15 text-yellow-400 rounded-lg text-sm font-semibold hover:bg-yellow-400/25 transition-colors"
          >
            {activity.repoShort || activity.repo?.split('/')[1] || activity.repo}
          </a>
          
          {/* Type Badge */}
          <span className={`px-3 py-1.5 ${style.badge} rounded-lg text-xs font-bold uppercase tracking-wide`}>
            {label}
          </span>
          
          {/* PR Number */}
          {activity.number && (
            <span className="text-sm font-mono text-frost-300/60">#{activity.number}</span>
          )}
          
          {/* Merged Badge */}
          {activity.state === 'merged' && (
            <span className="px-2.5 py-1 bg-fuchsia-500/25 text-fuchsia-400 border border-fuchsia-500/30 rounded-lg text-xs font-bold">
              MERGED
            </span>
          )}
          
          {/* Time */}
          <span className="ml-auto text-xs text-frost-300/50 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
          </span>
          
          {/* Link Icon */}
          <a 
            href={getUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-void-600/50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-frost-300/40 group-hover:text-frost-200" />
          </a>
        </div>
      </div>
      
      {/* Content */}
      <a href={getUrl()} target="_blank" rel="noopener noreferrer" className="block p-5">
        {/* Message */}
        <p className="text-frost-100 text-base font-medium leading-relaxed mb-4 group-hover:text-white transition-colors">
          {getMessage()}
        </p>
        
        {/* Info Boxes - Always shown for push/commit */}
        {(isPush || activity.type === ACTIVITY_TYPES.COMMIT) && (
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {/* Commit SHA */}
            {displaySha && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <Hash className="w-4 h-4 text-emerald-400" />
                <code className="text-sm font-mono text-emerald-400 font-semibold">
                  {displaySha.substring(0, 7)}
                </code>
              </div>
            )}
            
            {/* Branch */}
            {activity.branch && (
              <div className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                <GitBranch className="w-4 h-4 text-teal-400" />
                <span className="text-sm text-teal-400 font-medium">{activity.branch}</span>
              </div>
            )}
            
            {/* Lines Changed */}
            {(additions !== undefined || deletions !== undefined) ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-void-700/60 border border-void-600/40 rounded-xl">
                <Code2 className="w-4 h-4 text-frost-300/60" />
                <span className="text-sm font-semibold text-emerald-400">+{additions || 0}</span>
                <span className="text-sm font-semibold text-red-400">-{deletions || 0}</span>
              </div>
            ) : loadingDetails ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-void-700/60 border border-void-600/40 rounded-xl">
                <Loader2 className="w-4 h-4 text-frost-300/40 animate-spin" />
                <span className="text-sm text-frost-300/40">Loading...</span>
              </div>
            ) : null}
            
            {/* Files */}
            {changedFiles > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400 font-medium">{changedFiles} files</span>
              </div>
            )}
          </div>
        )}
        
        {/* PR Info */}
        {isPR && (additions !== undefined || deletions !== undefined || changedFiles > 0) && (
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {(additions !== undefined || deletions !== undefined) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-void-700/60 border border-void-600/40 rounded-xl">
                <Code2 className="w-4 h-4 text-frost-300/60" />
                <span className="text-sm font-semibold text-emerald-400">+{additions || 0}</span>
                <span className="text-sm font-semibold text-red-400">-{deletions || 0}</span>
              </div>
            )}
            {changedFiles > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400 font-medium">{changedFiles} files</span>
              </div>
            )}
          </div>
        )}
        
        {/* Multiple Commits */}
        {hasMultipleCommits && (
          <div className="mb-4">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCommits(!showCommits) }}
              className="flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Layers className="w-4 h-4" />
              {commits.length} commits
              {showCommits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showCommits && (
              <div className="mt-3 space-y-2 pl-3 border-l-2 border-emerald-500/30">
                {commits.map((c, i) => (
                  <a
                    key={c.sha || i}
                    href={c.url || `https://github.com/${activity.repo}/commit/${c.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 py-2 px-3 hover:bg-void-700/50 rounded-lg group/commit transition-colors"
                  >
                    <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                    <code className="text-xs text-emerald-400 font-mono">{c.sha?.substring(0, 7)}</code>
                    <span className="text-sm text-frost-300/70 truncate flex-1">{c.message?.split('\n')[0]}</span>
                    <ExternalLink className="w-3 h-3 text-frost-300/20 group-hover/commit:text-emerald-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Body Preview */}
        {activity.body && (
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-frost-300/70 italic line-clamp-2">
              "{activity.body.slice(0, 200)}{activity.body.length > 200 ? '...' : ''}"
            </p>
          </div>
        )}
        
        {/* Branch Created */}
        {activity.type === ACTIVITY_TYPES.BRANCH_CREATED && activity.branch && (
          <div className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl w-fit">
            <GitBranch className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">{activity.branch}</span>
          </div>
        )}
        
        {/* Tag */}
        {activity.tagName && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl w-fit">
            <Tag className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">{activity.tagName}</span>
          </div>
        )}
      </a>
    </div>
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
  
  // Fullscreen
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
          <div className="max-w-5xl mx-auto space-y-4">
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
            <span className="text-sm px-3 py-1 bg-void-600/50 rounded-full text-frost-300/60 font-medium">
              {filteredActivities.length}
            </span>
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
      
      <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight }}>
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
