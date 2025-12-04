/**
 * Enhanced Activity Feed Component
 * Fullscreen capable, beautifully styled, highly readable
 */

import { useState, useMemo } from 'react'
import { 
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, ExternalLink,
  CheckCircle, XCircle, AlertCircle, GitBranch, Tag, Rocket, Clock,
  MessageCircle, Trash2, RefreshCw, Upload, GitFork, Activity,
  Maximize2, Minimize2, ChevronDown, ChevronUp, X, Filter, ArrowUpRight,
  Search
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ACTIVITY_TYPES, ACTIVITY_CONFIG, DEFAULT_ACTIVITY_CONFIG } from '../../api/github/activities'

// Icon mapping
const ICONS = {
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, CheckCircle,
  XCircle, AlertCircle, GitBranch, Tag, Rocket, MessageCircle, Trash2,
  RefreshCw, Upload, GitFork, Activity, CheckCircle2: CheckCircle,
}

// ============ ENHANCED ACTIVITY CARD ============
function EnhancedActivityCard({ activity, onMemberClick, isExpanded = false }) {
  const [showDetails, setShowDetails] = useState(false)
  const config = ACTIVITY_CONFIG[activity.type] || DEFAULT_ACTIVITY_CONFIG
  const IconComponent = ICONS[config.icon] || Activity
  
  const handleAuthorClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onMemberClick?.(activity.author)
  }
  
  // Get status color for the left border
  const getStatusColor = () => {
    if (activity.type === ACTIVITY_TYPES.REVIEW_APPROVED) return 'border-l-green-500'
    if (activity.type === ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED) return 'border-l-red-400'
    if (activity.type === ACTIVITY_TYPES.PR_MERGED) return 'border-l-purple-500'
    if (activity.type === ACTIVITY_TYPES.PR_CLOSED) return 'border-l-gray-400'
    if (activity.type?.includes('comment')) return 'border-l-blue-400'
    if (activity.type?.includes('commit') || activity.type === ACTIVITY_TYPES.PUSH) return 'border-l-neon-green'
    return 'border-l-electric-400'
  }
  
  return (
    <div 
      className={`group relative bg-void-800/80 hover:bg-void-700/80 rounded-2xl border border-void-600/40 hover:border-void-500/50 transition-all duration-200 overflow-hidden ${getStatusColor()} border-l-4`}
    >
      {/* Main Content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon with glow effect */}
          <div className={`relative p-3 ${config.bg} rounded-xl flex-shrink-0 shadow-lg`}>
            <IconComponent className={`w-5 h-5 text-${config.color}`} />
            <div className={`absolute inset-0 rounded-xl bg-${config.color}/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity`} />
          </div>
          
          {/* Content Area */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Author & Repo */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <button 
                    onClick={handleAuthorClick}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity group/author"
                  >
                    {activity.avatarUrl && (
                      <img 
                        src={activity.avatarUrl} 
                        alt="" 
                        className="w-7 h-7 rounded-full ring-2 ring-void-600 group-hover/author:ring-electric-400/50 transition-all" 
                      />
                    )}
                    <span className="font-semibold text-frost-100 group-hover/author:text-electric-400 transition-colors">
                      {activity.author}
                    </span>
                  </button>
                  
                  <span className="text-frost-300/30">→</span>
                  
                  <a 
                    href={`https://github.com/${activity.repo?.split('/')[0] || ''}/${activity.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-yellow-400/15 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-400/25 transition-colors"
                  >
                    {activity.repo}
                  </a>
                </div>
                
                {/* Activity Type Badge & Number */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${config.bg} text-${config.color} rounded-lg text-xs font-bold uppercase tracking-wide`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                  
                  {activity.number && (
                    <span className="text-sm font-mono text-frost-300/60">#{activity.number}</span>
                  )}
                  
                  {activity.state && activity.state !== 'open' && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      activity.state === 'merged' ? 'bg-purple-500/20 text-purple-400' :
                      activity.state === 'closed' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {activity.state}
                    </span>
                  )}
                  
                  {activity.draft && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs font-medium">
                      Draft
                    </span>
                  )}
                </div>
              </div>
              
              {/* External Link */}
              {activity.url && (
                <a 
                  href={activity.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2.5 bg-void-700/50 hover:bg-void-600 rounded-xl opacity-60 group-hover:opacity-100 transition-all flex-shrink-0"
                >
                  <ArrowUpRight className="w-4 h-4 text-frost-300" />
                </a>
              )}
            </div>
            
            {/* Message */}
            <div className="text-frost-100 text-base leading-relaxed">
              {activity.fullMessage || activity.message}
            </div>
            
            {/* Body/Comment Content */}
            {activity.body && (
              <div className="mt-3 p-4 bg-void-900/60 border border-void-600/30 rounded-xl">
                <p className="text-sm text-frost-300/80 italic line-clamp-4 leading-relaxed">
                  "{activity.body.slice(0, 300)}{activity.body.length > 300 ? '...' : ''}"
                </p>
              </div>
            )}
            
            {/* Push Commits */}
            {activity.type === ACTIVITY_TYPES.PUSH && activity.commits?.length > 0 && (
              <div className="mt-3 space-y-2">
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-xs text-electric-400 hover:text-electric-500 transition-colors"
                >
                  {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {activity.commits.length} commits
                </button>
                {showDetails && (
                  <div className="pl-3 border-l-2 border-void-600/50 space-y-2">
                    {activity.commits.slice(0, 5).map((commit, i) => (
                      <div key={commit.sha || i} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-neon-green">{commit.sha?.substring(0, 7)}</span>
                        <span className="text-frost-300/70 truncate">{commit.message?.split('\n')[0]}</span>
                      </div>
                    ))}
                    {activity.commits.length > 5 && (
                      <span className="text-xs text-frost-300/40">+{activity.commits.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Code Path */}
            {activity.path && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-void-900/50 rounded-lg">
                <code className="text-xs font-mono text-frost-300/60">
                  {activity.path}{activity.line ? `:${activity.line}` : ''}
                </code>
              </div>
            )}
            
            {/* Branch/Tag Info */}
            {(activity.branch || activity.tagName) && (
              <div className="flex items-center gap-2 flex-wrap">
                {activity.branch && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-400/15 text-teal-400 rounded-lg text-xs font-medium">
                    <GitBranch className="w-3 h-3" />{activity.branch}
                    {activity.baseBranch && (
                      <>
                        <span className="text-frost-300/30 mx-1">←</span>
                        {activity.baseBranch}
                      </>
                    )}
                  </span>
                )}
                {activity.tagName && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-400/15 text-blue-400 rounded-lg text-xs font-medium">
                    <Tag className="w-3 h-3" />{activity.tagName}
                  </span>
                )}
              </div>
            )}
            
            {/* Labels */}
            {activity.labels && activity.labels.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {activity.labels.map(l => (
                  <span 
                    key={l.name} 
                    className="text-xs px-2.5 py-1 rounded-lg font-medium" 
                    style={{ backgroundColor: `#${l.color}25`, color: `#${l.color}` }}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            )}
            
            {/* Footer Stats */}
            <div className="flex items-center gap-4 pt-3 border-t border-void-600/30 text-xs text-frost-300/50">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
              </span>
              
              {activity.shortSha && (
                <span className="font-mono bg-void-700/50 px-2 py-1 rounded">{activity.shortSha}</span>
              )}
              
              {activity.commitCount && activity.commitCount > 1 && (
                <span className="flex items-center gap-1 text-neon-green">
                  <GitCommit className="w-3 h-3" />{activity.commitCount}
                </span>
              )}
              
              {(activity.additions !== undefined || activity.deletions !== undefined) && (
                <span className="flex items-center gap-2">
                  {activity.additions !== undefined && (
                    <span className="text-neon-green">+{activity.additions}</span>
                  )}
                  {activity.deletions !== undefined && (
                    <span className="text-red-400">-{activity.deletions}</span>
                  )}
                </span>
              )}
              
              {activity.changedFiles && (
                <span>{activity.changedFiles} files</span>
              )}
              
              {activity.prAuthor && activity.prAuthor !== activity.author && (
                <span className="text-frost-300/40">on @{activity.prAuthor}'s PR</span>
              )}
            </div>
          </div>
        </div>
      </div>
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
  
  // Filter activities by search
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities
    const q = searchQuery.toLowerCase()
    return activities.filter(a => 
      a.message?.toLowerCase().includes(q) ||
      a.author?.toLowerCase().includes(q) ||
      a.repo?.toLowerCase().includes(q) ||
      a.body?.toLowerCase().includes(q)
    )
  }, [activities, searchQuery])
  
  const displayCount = expandedView ? filteredActivities.length : Math.min(filteredActivities.length, 50)
  
  // Fullscreen modal
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-void-900/98 backdrop-blur-xl overflow-hidden flex flex-col">
        {/* Fullscreen Header */}
        <div className="flex-shrink-0 p-6 border-b border-void-600/50 bg-void-800/50">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Activity className="w-6 h-6 text-electric-400" />
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
              
              <button 
                onClick={() => setIsFullscreen(false)}
                className="p-3 bg-void-700/50 hover:bg-void-600 rounded-xl transition-colors"
              >
                <Minimize2 className="w-5 h-5 text-frost-300" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Fullscreen Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredActivities.map((activity, i) => (
              <EnhancedActivityCard 
                key={activity.id || i}
                activity={activity} 
                onMemberClick={onMemberClick}
                isExpanded 
              />
            ))}
            
            {filteredActivities.length === 0 && (
              <div className="text-center py-20 text-frost-300/50">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No activities found</p>
                {searchQuery && <p className="text-sm mt-2">Try a different search term</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // Regular view
  return (
    <div className="bg-void-700/20 border border-void-600/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-void-600/30 bg-void-800/30">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-electric-400" />
          <h3 className="text-frost-100 font-bold text-lg">{title}</h3>
          {showCount && (
            <span className="text-sm px-3 py-1 bg-void-600/50 rounded-full text-frost-300/60 font-medium">
              {filteredActivities.length} activities
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
          
          <button 
            onClick={() => setIsFullscreen(true)}
            className="p-2 bg-void-700/50 hover:bg-void-600 rounded-lg transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-frost-300/60" />
          </button>
        </div>
      </div>
      
      {/* Activity List */}
      <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight }}>
        {filteredActivities.slice(0, displayCount).map((activity, i) => (
          <EnhancedActivityCard 
            key={activity.id || i}
            activity={activity} 
            onMemberClick={onMemberClick} 
          />
        ))}
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-16 text-frost-300/50">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No activities found</p>
          </div>
        )}
        
        {/* Load More */}
        {filteredActivities.length > 50 && !expandedView && (
          <button 
            onClick={() => setExpandedView(true)}
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

