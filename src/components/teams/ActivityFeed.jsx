/**
 * Enhanced Activity Feed Component
 * Fullscreen capable, beautifully styled, highly readable
 * Each activity type has distinct styling
 */

import { useState, useMemo } from 'react'
import { 
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, ExternalLink,
  CheckCircle, XCircle, AlertCircle, GitBranch, Tag, Rocket, Clock,
  MessageCircle, Trash2, RefreshCw, Upload, GitFork, Activity,
  Maximize2, Minimize2, ChevronDown, ChevronUp, X, Filter, ArrowUpRight,
  Search, Plus, Minus, FileCode, Star, BookOpen, Code2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ACTIVITY_TYPES, ACTIVITY_CONFIG, DEFAULT_ACTIVITY_CONFIG } from '../../api/github/activities'

// ============ ACTIVITY TYPE STYLES ============
const ACTIVITY_STYLES = {
  // Commits & Pushes - Green theme
  [ACTIVITY_TYPES.COMMIT]: {
    border: 'border-l-emerald-500',
    bg: 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
  },
  [ACTIVITY_TYPES.PUSH]: {
    border: 'border-l-green-500',
    bg: 'bg-gradient-to-br from-green-500/10 via-transparent to-transparent',
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-400',
    badgeBg: 'bg-green-500/20',
    badgeText: 'text-green-400',
    badgeBorder: 'border-green-500/30',
  },
  
  // PRs - Purple/Pink theme
  [ACTIVITY_TYPES.PR_OPENED]: {
    border: 'border-l-purple-500',
    bg: 'bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-transparent',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
  },
  [ACTIVITY_TYPES.PR_MERGED]: {
    border: 'border-l-fuchsia-500',
    bg: 'bg-gradient-to-br from-fuchsia-500/15 via-purple-500/10 to-transparent',
    iconBg: 'bg-fuchsia-500/25',
    iconColor: 'text-fuchsia-400',
    badgeBg: 'bg-fuchsia-500/25',
    badgeText: 'text-fuchsia-400',
    badgeBorder: 'border-fuchsia-500/40',
  },
  [ACTIVITY_TYPES.PR_CLOSED]: {
    border: 'border-l-gray-500',
    bg: 'bg-gradient-to-br from-gray-500/10 via-transparent to-transparent',
    iconBg: 'bg-gray-500/20',
    iconColor: 'text-gray-400',
    badgeBg: 'bg-gray-500/20',
    badgeText: 'text-gray-400',
    badgeBorder: 'border-gray-500/30',
  },
  
  // Reviews - Cyan/Teal theme
  [ACTIVITY_TYPES.REVIEW_APPROVED]: {
    border: 'border-l-teal-400',
    bg: 'bg-gradient-to-br from-teal-500/15 via-cyan-500/5 to-transparent',
    iconBg: 'bg-teal-500/25',
    iconColor: 'text-teal-400',
    badgeBg: 'bg-teal-500/25',
    badgeText: 'text-teal-400',
    badgeBorder: 'border-teal-500/40',
  },
  [ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED]: {
    border: 'border-l-orange-500',
    bg: 'bg-gradient-to-br from-orange-500/15 via-red-500/5 to-transparent',
    iconBg: 'bg-orange-500/25',
    iconColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/25',
    badgeText: 'text-orange-400',
    badgeBorder: 'border-orange-500/40',
  },
  [ACTIVITY_TYPES.REVIEW_COMMENTED]: {
    border: 'border-l-cyan-400',
    bg: 'bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent',
    iconBg: 'bg-cyan-500/20',
    iconColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
  },
  
  // Comments - Blue theme
  [ACTIVITY_TYPES.PR_COMMENT]: {
    border: 'border-l-blue-400',
    bg: 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
  },
  [ACTIVITY_TYPES.ISSUE_COMMENT]: {
    border: 'border-l-indigo-400',
    bg: 'bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
  },
  
  // Branches & Tags - Teal/Amber theme
  [ACTIVITY_TYPES.BRANCH_CREATED]: {
    border: 'border-l-teal-500',
    bg: 'bg-gradient-to-br from-teal-500/10 via-transparent to-transparent',
    iconBg: 'bg-teal-500/20',
    iconColor: 'text-teal-400',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-400',
    badgeBorder: 'border-teal-500/30',
  },
  [ACTIVITY_TYPES.BRANCH_DELETED]: {
    border: 'border-l-red-400',
    bg: 'bg-gradient-to-br from-red-500/10 via-transparent to-transparent',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-500/30',
  },
  [ACTIVITY_TYPES.TAG_CREATED]: {
    border: 'border-l-amber-500',
    bg: 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
  },
  
  // Releases - Gold theme
  [ACTIVITY_TYPES.RELEASE_PUBLISHED]: {
    border: 'border-l-yellow-500',
    bg: 'bg-gradient-to-br from-yellow-500/15 via-amber-500/10 to-transparent',
    iconBg: 'bg-yellow-500/25',
    iconColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/25',
    badgeText: 'text-yellow-400',
    badgeBorder: 'border-yellow-500/40',
  },
}

const DEFAULT_STYLE = {
  border: 'border-l-electric-400',
  bg: 'bg-gradient-to-br from-electric-400/10 via-transparent to-transparent',
  iconBg: 'bg-electric-400/20',
  iconColor: 'text-electric-400',
  badgeBg: 'bg-electric-400/20',
  badgeText: 'text-electric-400',
  badgeBorder: 'border-electric-400/30',
}

// Icon mapping
const ICONS = {
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, CheckCircle,
  XCircle, AlertCircle, GitBranch, Tag, Rocket, MessageCircle, Trash2,
  RefreshCw, Upload, GitFork, Activity, CheckCircle2: CheckCircle,
}

// ============ ENHANCED ACTIVITY CARD ============
function EnhancedActivityCard({ activity, onMemberClick }) {
  const [showCommits, setShowCommits] = useState(false)
  const config = ACTIVITY_CONFIG[activity.type] || DEFAULT_ACTIVITY_CONFIG
  const style = ACTIVITY_STYLES[activity.type] || DEFAULT_STYLE
  const IconComponent = ICONS[config.icon] || Activity
  
  const handleAuthorClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onMemberClick?.(activity.author)
  }
  
  // Build the main clickable URL
  const getMainUrl = () => {
    if (activity.url) return activity.url
    if (activity.type === ACTIVITY_TYPES.COMMIT && activity.sha) {
      return `https://github.com/${activity.repo}/commit/${activity.sha}`
    }
    if (activity.type === ACTIVITY_TYPES.PUSH && activity.commits?.[0]?.sha) {
      return `https://github.com/${activity.repo}/commit/${activity.commits[0].sha}`
    }
    if (activity.number) {
      return `https://github.com/${activity.repo}/pull/${activity.number}`
    }
    return `https://github.com/${activity.repo}`
  }
  
  // Get proper message for push events
  const getMessage = () => {
    if (activity.type === ACTIVITY_TYPES.PUSH) {
      const commitCount = activity.commits?.length || activity.commitCount || 0
      if (commitCount > 0) {
        // Show first commit message
        const firstCommit = activity.commits?.[0]
        if (firstCommit?.message) {
          return firstCommit.message.split('\n')[0]
        }
        return `Pushed ${commitCount} commit${commitCount > 1 ? 's' : ''}`
      }
      return activity.message || 'Pushed changes'
    }
    return activity.fullMessage || activity.message
  }
  
  // Get subtitle info
  const getSubtitle = () => {
    if (activity.type === ACTIVITY_TYPES.PUSH) {
      const commitCount = activity.commits?.length || activity.commitCount || 0
      if (commitCount > 1) {
        return `${commitCount} commits to ${activity.branch || 'branch'}`
      }
      if (activity.branch) {
        return `to ${activity.branch}`
      }
    }
    if (activity.type === ACTIVITY_TYPES.COMMIT) {
      return activity.branch ? `on ${activity.branch}` : null
    }
    if (activity.number) {
      return `#${activity.number}`
    }
    return null
  }
  
  const mainUrl = getMainUrl()
  const message = getMessage()
  const subtitle = getSubtitle()
  
  return (
    <a
      href={mainUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block relative rounded-2xl border-l-4 ${style.border} overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-xl`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 ${style.bg}`} />
      <div className="absolute inset-0 bg-void-800/70 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`relative p-3.5 ${style.iconBg} rounded-2xl flex-shrink-0 shadow-lg ring-1 ring-white/5`}>
            <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 rounded-2xl ${style.iconBg} blur-xl opacity-0 group-hover:opacity-60 transition-opacity`} />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header: Author → Repo */}
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={handleAuthorClick}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {activity.avatarUrl && (
                  <img 
                    src={activity.avatarUrl} 
                    alt="" 
                    className="w-7 h-7 rounded-full ring-2 ring-void-600 group-hover:ring-white/20 transition-all" 
                  />
                )}
                <span className="font-bold text-frost-100 hover:text-white transition-colors">
                  {activity.author}
                </span>
              </button>
              
              <span className="text-frost-300/30">→</span>
              
              <span 
                className="px-2.5 py-1 bg-yellow-400/15 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-400/25 transition-colors"
                onClick={(e) => { e.preventDefault(); window.open(`https://github.com/${activity.repo}`, '_blank') }}
              >
                {activity.repo}
              </span>
              
              {/* Activity Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${style.badgeBg} ${style.badgeText} border ${style.badgeBorder} rounded-lg text-xs font-bold uppercase tracking-wide`}>
                <IconComponent className="w-3.5 h-3.5" />
                {config.label}
              </span>
              
              {/* Number/ID */}
              {activity.number && (
                <span className="text-sm font-mono text-frost-300/50">#{activity.number}</span>
              )}
              
              {/* State badges */}
              {activity.state === 'merged' && (
                <span className="px-2.5 py-1 bg-fuchsia-500/25 text-fuchsia-400 border border-fuchsia-500/30 rounded-lg text-xs font-bold">
                  MERGED
                </span>
              )}
              {activity.state === 'closed' && activity.type !== ACTIVITY_TYPES.PR_MERGED && (
                <span className="px-2.5 py-1 bg-gray-500/25 text-gray-400 border border-gray-500/30 rounded-lg text-xs font-bold">
                  CLOSED
                </span>
              )}
              {activity.draft && (
                <span className="px-2.5 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-bold">
                  DRAFT
                </span>
              )}
            </div>
            
            {/* Main Message - Clickable */}
            <div className="space-y-1">
              <p className="text-frost-100 text-base font-medium leading-relaxed group-hover:text-white transition-colors">
                {message}
              </p>
              {subtitle && (
                <p className="text-sm text-frost-300/60">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Body/Comment Preview */}
            {activity.body && (
              <div className="p-4 bg-void-900/60 border border-void-600/30 rounded-xl">
                <p className="text-sm text-frost-300/80 italic line-clamp-3 leading-relaxed">
                  "{activity.body.slice(0, 250)}{activity.body.length > 250 ? '...' : ''}"
                </p>
              </div>
            )}
            
            {/* Commits list for Push events */}
            {activity.type === ACTIVITY_TYPES.PUSH && activity.commits && activity.commits.length > 1 && (
              <div className="space-y-2">
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCommits(!showCommits) }}
                  className={`flex items-center gap-2 text-xs font-medium ${style.badgeText} hover:opacity-80 transition-opacity`}
                >
                  {showCommits ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  View all {activity.commits.length} commits
                </button>
                
                {showCommits && (
                  <div className="pl-4 border-l-2 border-void-600/50 space-y-2 max-h-48 overflow-y-auto">
                    {activity.commits.map((commit, i) => (
                      <a
                        key={commit.sha || i}
                        href={`https://github.com/${activity.repo}/commit/${commit.sha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-void-700/50 transition-colors group/commit"
                      >
                        <span className="font-mono text-xs text-emerald-400 group-hover/commit:text-emerald-300 flex-shrink-0">
                          {commit.sha?.substring(0, 7)}
                        </span>
                        <span className="text-xs text-frost-300/70 group-hover/commit:text-frost-200 line-clamp-1">
                          {commit.message?.split('\n')[0]}
                        </span>
                        <ExternalLink className="w-3 h-3 text-frost-300/30 opacity-0 group-hover/commit:opacity-100 flex-shrink-0 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Single commit for Commit events */}
            {activity.type === ACTIVITY_TYPES.COMMIT && activity.shortSha && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                <code className="text-xs font-mono text-emerald-400">{activity.shortSha}</code>
              </div>
            )}
            
            {/* Code Path for review comments */}
            {activity.path && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-void-900/50 border border-void-600/30 rounded-lg">
                <FileCode className="w-3.5 h-3.5 text-frost-300/50" />
                <code className="text-xs font-mono text-frost-300/60">
                  {activity.path}{activity.line ? `:${activity.line}` : ''}
                </code>
              </div>
            )}
            
            {/* Branch/Tag Info */}
            {(activity.branch || activity.tagName) && (
              <div className="flex items-center gap-2 flex-wrap">
                {activity.branch && (
                  <a
                    href={`https://github.com/${activity.repo}/tree/${activity.branch}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-400/15 text-teal-400 border border-teal-400/20 rounded-lg text-xs font-medium hover:bg-teal-400/25 transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    {activity.branch}
                    {activity.baseBranch && (
                      <>
                        <span className="text-frost-300/30 mx-1">←</span>
                        {activity.baseBranch}
                      </>
                    )}
                  </a>
                )}
                {activity.tagName && (
                  <a
                    href={`https://github.com/${activity.repo}/releases/tag/${activity.tagName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-400/15 text-amber-400 border border-amber-400/20 rounded-lg text-xs font-medium hover:bg-amber-400/25 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    {activity.tagName}
                  </a>
                )}
              </div>
            )}
            
            {/* Labels */}
            {activity.labels && activity.labels.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activity.labels.map(l => (
                  <span 
                    key={l.name} 
                    className="text-xs px-2.5 py-1 rounded-lg font-medium" 
                    style={{ backgroundColor: `#${l.color}25`, color: `#${l.color}`, borderColor: `#${l.color}40` }}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            )}
            
            {/* Stats Footer */}
            <div className="flex items-center gap-4 pt-3 border-t border-void-600/20 text-xs">
              <span className="flex items-center gap-1.5 text-frost-300/50">
                <Clock className="w-3.5 h-3.5" />
                {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
              </span>
              
              {/* Line changes */}
              {(activity.additions !== undefined || activity.deletions !== undefined) && (
                <span className="flex items-center gap-2">
                  {activity.additions > 0 && (
                    <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                      <Plus className="w-3 h-3" />{activity.additions}
                    </span>
                  )}
                  {activity.deletions > 0 && (
                    <span className="flex items-center gap-0.5 text-red-400 font-medium">
                      <Minus className="w-3 h-3" />{activity.deletions}
                    </span>
                  )}
                </span>
              )}
              
              {activity.changedFiles > 0 && (
                <span className="flex items-center gap-1 text-frost-300/50">
                  <FileCode className="w-3 h-3" />{activity.changedFiles} files
                </span>
              )}
              
              {activity.commitCount > 0 && activity.type !== ACTIVITY_TYPES.PUSH && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <GitCommit className="w-3 h-3" />{activity.commitCount}
                </span>
              )}
              
              {activity.prAuthor && activity.prAuthor !== activity.author && (
                <span className="text-frost-300/40">on @{activity.prAuthor}'s PR</span>
              )}
              
              {/* External link indicator */}
              <span className="ml-auto flex items-center gap-1 text-frost-300/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px]">View on GitHub</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
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
      a.body?.toLowerCase().includes(q) ||
      a.branch?.toLowerCase().includes(q)
    )
  }, [activities, searchQuery])
  
  const displayCount = expandedView ? filteredActivities.length : Math.min(filteredActivities.length, 50)
  
  // Fullscreen modal
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-void-900/98 backdrop-blur-xl overflow-hidden flex flex-col">
        {/* Fullscreen Header */}
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
          <div className="max-w-5xl mx-auto space-y-4">
            {filteredActivities.map((activity, i) => (
              <EnhancedActivityCard 
                key={activity.id || i}
                activity={activity} 
                onMemberClick={onMemberClick}
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

