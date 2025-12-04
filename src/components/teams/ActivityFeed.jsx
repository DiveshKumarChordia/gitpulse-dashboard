/**
 * Enhanced Activity Feed Component
 * Beautiful multi-color cards with comprehensive commit details
 */

import { useState, useMemo } from 'react'
import { 
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, ExternalLink,
  CheckCircle, XCircle, AlertCircle, GitBranch, Tag, Rocket, Clock,
  MessageCircle, Trash2, RefreshCw, Upload, GitFork, Activity,
  Maximize2, Minimize2, ChevronDown, ChevronUp, Search, Plus, Minus, 
  FileCode, ArrowUpRight, Code2, FolderOpen, Hash, Layers
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ACTIVITY_TYPES } from '../../api/github/activities'

// ============ ACTIVITY TYPE STYLES ============
const ACTIVITY_STYLES = {
  [ACTIVITY_TYPES.COMMIT]: {
    border: 'border-l-emerald-500',
    headerBg: 'bg-emerald-500/10',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    accent: 'emerald',
  },
  [ACTIVITY_TYPES.PUSH]: {
    border: 'border-l-green-500',
    headerBg: 'bg-green-500/10',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    accent: 'green',
  },
  [ACTIVITY_TYPES.PR_OPENED]: {
    border: 'border-l-purple-500',
    headerBg: 'bg-purple-500/10',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    accent: 'purple',
  },
  [ACTIVITY_TYPES.PR_MERGED]: {
    border: 'border-l-fuchsia-500',
    headerBg: 'bg-fuchsia-500/10',
    iconBg: 'bg-fuchsia-500/20',
    iconColor: 'text-fuchsia-400',
    accent: 'fuchsia',
  },
  [ACTIVITY_TYPES.PR_CLOSED]: {
    border: 'border-l-gray-500',
    headerBg: 'bg-gray-500/10',
    iconBg: 'bg-gray-500/20',
    iconColor: 'text-gray-400',
    accent: 'gray',
  },
  [ACTIVITY_TYPES.REVIEW_APPROVED]: {
    border: 'border-l-teal-400',
    headerBg: 'bg-teal-500/10',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    accent: 'teal',
  },
  [ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED]: {
    border: 'border-l-orange-500',
    headerBg: 'bg-orange-500/10',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
    accent: 'orange',
  },
  [ACTIVITY_TYPES.REVIEW_COMMENTED]: {
    border: 'border-l-cyan-400',
    headerBg: 'bg-cyan-500/10',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
    accent: 'cyan',
  },
  [ACTIVITY_TYPES.PR_COMMENT]: {
    border: 'border-l-blue-400',
    headerBg: 'bg-blue-500/10',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    accent: 'blue',
  },
  [ACTIVITY_TYPES.ISSUE_COMMENT]: {
    border: 'border-l-indigo-400',
    headerBg: 'bg-indigo-500/10',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    accent: 'indigo',
  },
  [ACTIVITY_TYPES.BRANCH_CREATED]: {
    border: 'border-l-teal-500',
    headerBg: 'bg-teal-500/10',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    accent: 'teal',
  },
  [ACTIVITY_TYPES.BRANCH_DELETED]: {
    border: 'border-l-red-400',
    headerBg: 'bg-red-500/10',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    accent: 'red',
  },
  [ACTIVITY_TYPES.TAG_CREATED]: {
    border: 'border-l-amber-500',
    headerBg: 'bg-amber-500/10',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    accent: 'amber',
  },
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: {
    border: 'border-l-yellow-500',
    headerBg: 'bg-yellow-500/10',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-400',
    accent: 'yellow',
  },
}

const DEFAULT_STYLE = {
  border: 'border-l-electric-400',
  headerBg: 'bg-electric-400/10',
  iconBg: 'bg-electric-400/20',
  iconColor: 'text-electric-400',
  accent: 'electric',
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
  [ACTIVITY_TYPES.BRANCH_CREATED]: 'Branch Created',
  [ACTIVITY_TYPES.BRANCH_DELETED]: 'Branch Deleted',
  [ACTIVITY_TYPES.TAG_CREATED]: 'Tag',
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: 'Release',
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

// ============ COMMIT DETAILS SECTION ============
function CommitDetails({ commits, repo, expanded, onToggle }) {
  if (!commits || commits.length === 0) return null
  
  return (
    <div className="mt-4">
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle() }}
        className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        <Layers className="w-4 h-4" />
        {commits.length} commit{commits.length > 1 ? 's' : ''}
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {expanded && (
        <div className="mt-3 space-y-2 animate-fadeIn">
          {commits.map((commit, i) => (
            <a
              key={commit.sha || i}
              href={commit.url || `https://github.com/${repo}/commit/${commit.sha}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-start gap-3 p-3 bg-void-900/60 hover:bg-void-800/60 border border-void-600/30 hover:border-emerald-500/30 rounded-xl transition-all group/commit"
            >
              <GitCommit className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                    {commit.sha?.substring(0, 7)}
                  </code>
                  <ExternalLink className="w-3 h-3 text-frost-300/30 group-hover/commit:text-emerald-400 transition-colors" />
                </div>
                <p className="text-sm text-frost-200 group-hover/commit:text-white transition-colors line-clamp-2">
                  {commit.message?.split('\n')[0]}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ ENHANCED ACTIVITY CARD ============
function EnhancedActivityCard({ activity, onMemberClick }) {
  const [showCommits, setShowCommits] = useState(false)
  const [showFiles, setShowFiles] = useState(false)
  
  const style = ACTIVITY_STYLES[activity.type] || DEFAULT_STYLE
  const Icon = ICONS[activity.type] || Activity
  const label = ACTIVITY_LABELS[activity.type] || 'Activity'
  
  const handleAuthorClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onMemberClick?.(activity.author)
  }
  
  // Get the main URL
  const getMainUrl = () => {
    if (activity.url) return activity.url
    if (activity.type === ACTIVITY_TYPES.PUSH && activity.commits?.[0]?.sha) {
      return `https://github.com/${activity.repo}/commit/${activity.commits[0].sha}`
    }
    if (activity.sha) {
      return `https://github.com/${activity.repo}/commit/${activity.sha}`
    }
    return `https://github.com/${activity.repo}`
  }
  
  // Get display message
  const getMessage = () => {
    if (activity.type === ACTIVITY_TYPES.PUSH && activity.commits?.length > 0) {
      return activity.commits[0]?.message?.split('\n')[0] || activity.message
    }
    return activity.message
  }
  
  const mainUrl = getMainUrl()
  const displayMessage = getMessage()
  const hasCommits = activity.commits && activity.commits.length > 0
  const hasMultipleCommits = activity.commits && activity.commits.length > 1
  
  return (
    <div className={`group relative rounded-2xl overflow-hidden border-l-4 ${style.border} bg-void-800/70 hover:bg-void-800/90 transition-all duration-200`}>
      {/* Header Section - Colored */}
      <div className={`${style.headerBg} px-5 py-3 border-b border-void-600/30`}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Icon */}
          <div className={`p-2.5 ${style.iconBg} rounded-xl shadow-lg`}>
            <Icon className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          
          {/* Author */}
          <button 
            onClick={handleAuthorClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {activity.avatarUrl && (
              <img src={activity.avatarUrl} alt="" className="w-7 h-7 rounded-full ring-2 ring-void-600" />
            )}
            <span className="font-bold text-frost-100">{activity.author}</span>
          </button>
          
          <span className="text-frost-300/30">→</span>
          
          {/* Repo */}
          <a 
            href={`https://github.com/${activity.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1.5 bg-yellow-400/15 text-yellow-400 rounded-lg text-sm font-semibold hover:bg-yellow-400/25 transition-colors"
          >
            {activity.repo}
          </a>
          
          {/* Activity Type Badge */}
          <span className={`px-3 py-1.5 ${style.iconBg} ${style.iconColor} rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </span>
          
          {/* PR Number */}
          {activity.number && (
            <span className="text-sm font-mono text-frost-300/60">#{activity.number}</span>
          )}
          
          {/* Status Badges */}
          {activity.state === 'merged' && (
            <span className="px-2.5 py-1 bg-fuchsia-500/25 text-fuchsia-400 border border-fuchsia-500/30 rounded-lg text-xs font-bold">MERGED</span>
          )}
          {activity.draft && (
            <span className="px-2.5 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-bold">DRAFT</span>
          )}
          
          {/* Time - Right aligned */}
          <span className="ml-auto text-xs text-frost-300/50 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
          </span>
        </div>
      </div>
      
      {/* Main Content */}
      <a href={mainUrl} target="_blank" rel="noopener noreferrer" className="block p-5">
        {/* Message */}
        <p className="text-frost-100 text-base font-medium leading-relaxed mb-4 group-hover:text-white transition-colors">
          {displayMessage}
        </p>
        
        {/* Info Grid - Multi-colored sections */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Commit ID */}
          {(activity.shortSha || activity.commits?.[0]?.sha) && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400/70 uppercase font-medium">Commit ID</span>
              </div>
              <code className="text-sm font-mono text-emerald-400 font-semibold">
                {activity.shortSha || activity.commits?.[0]?.sha?.substring(0, 7)}
              </code>
            </div>
          )}
          
          {/* Branch */}
          {activity.branch && (
            <a 
              href={`https://github.com/${activity.repo}/tree/${activity.branch}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl hover:bg-teal-500/20 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-xs text-teal-400/70 uppercase font-medium">Branch</span>
              </div>
              <p className="text-sm text-teal-400 font-semibold truncate">{activity.branch}</p>
            </a>
          )}
          
          {/* Lines Changed */}
          {(activity.additions !== undefined || activity.deletions !== undefined) && (
            <div className="p-3 bg-void-700/50 border border-void-600/30 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Code2 className="w-3.5 h-3.5 text-frost-300/60" />
                <span className="text-xs text-frost-300/50 uppercase font-medium">Lines Changed</span>
              </div>
              <div className="flex items-center gap-3">
                {activity.additions !== undefined && (
                  <span className="flex items-center gap-1 text-sm font-bold text-emerald-400">
                    <Plus className="w-3.5 h-3.5" />{activity.additions}
                  </span>
                )}
                {activity.deletions !== undefined && (
                  <span className="flex items-center gap-1 text-sm font-bold text-red-400">
                    <Minus className="w-3.5 h-3.5" />{activity.deletions}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Files Changed */}
          {activity.changedFiles !== undefined && activity.changedFiles > 0 && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-purple-400/70 uppercase font-medium">Files</span>
              </div>
              <p className="text-sm text-purple-400 font-semibold">{activity.changedFiles} files</p>
            </div>
          )}
          
          {/* Commit Count (for push with multiple commits) */}
          {hasMultipleCommits && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400/70 uppercase font-medium">Commits</span>
              </div>
              <p className="text-sm text-amber-400 font-semibold">{activity.commits.length} commits</p>
            </div>
          )}
        </div>
        
        {/* Body/Comment Preview */}
        {activity.body && (
          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl mb-4">
            <p className="text-sm text-frost-300/80 italic line-clamp-3 leading-relaxed">
              "{activity.body.slice(0, 250)}{activity.body.length > 250 ? '...' : ''}"
            </p>
          </div>
        )}
        
        {/* Tag Info */}
        {activity.tagName && (
          <a
            href={`https://github.com/${activity.repo}/releases/tag/${activity.tagName}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-amber-400/15 text-amber-400 border border-amber-400/20 rounded-xl text-sm font-medium hover:bg-amber-400/25 transition-colors mb-4"
          >
            <Tag className="w-4 h-4" />
            {activity.tagName}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        
        {/* Labels */}
        {activity.labels && activity.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activity.labels.map(l => (
              <span 
                key={l.name} 
                className="px-2.5 py-1 rounded-lg text-xs font-medium" 
                style={{ backgroundColor: `#${l.color}20`, color: `#${l.color}` }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
        
        {/* View on GitHub hint */}
        <div className="flex items-center gap-2 text-xs text-frost-300/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Click to view on GitHub</span>
        </div>
      </a>
      
      {/* Commits Section - Outside the link */}
      {hasCommits && (
        <div className="px-5 pb-5 -mt-2">
          <CommitDetails 
            commits={activity.commits}
            repo={activity.repo}
            expanded={showCommits}
            onToggle={() => setShowCommits(!showCommits)}
          />
        </div>
      )}
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
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedView, setExpandedView] = useState(false)
  
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
  
  const displayCount = expandedView ? filteredActivities.length : Math.min(filteredActivities.length, 50)
  
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
          <div className="max-w-5xl mx-auto space-y-4">
            {filteredActivities.map((activity, i) => (
              <EnhancedActivityCard key={activity.id || i} activity={activity} onMemberClick={onMemberClick} />
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
      
      <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight }}>
        {filteredActivities.slice(0, displayCount).map((activity, i) => (
          <EnhancedActivityCard key={activity.id || i} activity={activity} onMemberClick={onMemberClick} />
        ))}
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-16 text-frost-300/50">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No activities found</p>
          </div>
        )}
        
        {filteredActivities.length > 50 && !expandedView && (
          <button 
            onClick={() => setExpandedView(true)}
            className="w-full py-3 bg-void-700/30 hover:bg-void-700/50 rounded-xl text-frost-300/60 hover:text-frost-200 text-sm transition-colors"
          >
            Load {filteredActivities.length - 50} more activities
          </button>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  )
}

export default ActivityFeed
