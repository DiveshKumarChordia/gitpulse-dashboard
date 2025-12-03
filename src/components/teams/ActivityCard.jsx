/**
 * Activity Card Component
 * Displays a single activity with comprehensive details
 */

import { 
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, ExternalLink,
  CheckCircle, XCircle, AlertCircle, GitBranch, Tag, Rocket, Clock,
  MessageCircle, Trash2, RefreshCw, Upload, GitFork, Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { ACTIVITY_TYPES, ACTIVITY_CONFIG, DEFAULT_ACTIVITY_CONFIG } from '../../api/github/activities'

// Icon mapping
const ICONS = {
  GitCommit, GitPullRequest, GitMerge, MessageSquare, Eye, CheckCircle,
  XCircle, AlertCircle, GitBranch, Tag, Rocket, MessageCircle, Trash2,
  RefreshCw, Upload, GitFork, Activity, CheckCircle2: CheckCircle,
}

export function ActivityCard({ activity, onMemberClick, animate = false, compact = false }) {
  const config = ACTIVITY_CONFIG[activity.type] || DEFAULT_ACTIVITY_CONFIG
  const IconComponent = ICONS[config.icon] || Activity
  
  const handleAuthorClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onMemberClick?.(activity.author)
  }
  
  const getDescription = () => {
    // Show body content for comments
    if (activity.body && (
      activity.type === ACTIVITY_TYPES.PR_COMMENT ||
      activity.type === ACTIVITY_TYPES.ISSUE_COMMENT ||
      activity.type === ACTIVITY_TYPES.COMMIT_COMMENT ||
      activity.type === ACTIVITY_TYPES.REVIEW_COMMENT ||
      activity.type === ACTIVITY_TYPES.REVIEW_APPROVED ||
      activity.type === ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED ||
      activity.type === ACTIVITY_TYPES.REVIEW_COMMENTED
    )) {
      const preview = activity.body.slice(0, 200)
      return (
        <span>
          {activity.message}
          <span className="block mt-2 text-frost-300/60 italic border-l-2 border-frost-300/20 pl-3">
            "{preview}{activity.body.length > 200 ? '...' : ''}"
          </span>
        </span>
      )
    }
    
    // Show commits for push events
    if (activity.type === ACTIVITY_TYPES.PUSH && activity.commits?.length > 0) {
      return (
        <span>
          {activity.message}
          <span className="block mt-2 space-y-1">
            {activity.commits.slice(0, 3).map(commit => (
              <span key={commit.sha} className="block text-frost-300/60 text-xs font-mono">
                • {commit.message?.split('\n')[0].slice(0, 60)}
              </span>
            ))}
            {activity.commits.length > 3 && (
              <span className="text-frost-300/40 text-xs">+{activity.commits.length - 3} more commits</span>
            )}
          </span>
        </span>
      )
    }
    
    return activity.fullMessage || activity.message
  }
  
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-void-700/20 rounded-lg hover:bg-void-700/40 transition-all ${animate ? 'animate-fadeIn' : ''}`}>
        <div className={`p-1.5 rounded-lg ${config.bg}`}>
          <IconComponent className={`w-3.5 h-3.5 text-${config.color}`} />
        </div>
        <button onClick={handleAuthorClick} className="flex items-center gap-2 hover:opacity-80">
          {activity.avatarUrl && <img src={activity.avatarUrl} alt="" className="w-5 h-5 rounded-full" />}
          <span className="text-xs font-medium text-frost-100">{activity.author}</span>
        </button>
        <span className="text-xs text-frost-300/60 truncate flex-1">{activity.message}</span>
        <span className="text-xs text-frost-300/40">{format(new Date(activity.date), 'MMM d')}</span>
      </div>
    )
  }
  
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-void-600/50 bg-gradient-to-r ${config.gradient} hover:border-frost-300/30 transition-all duration-300 ${animate ? 'animate-fadeIn' : ''}`}>
      <div className="absolute inset-0 bg-void-800/60 backdrop-blur-sm" />
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2.5 ${config.bg} rounded-xl flex-shrink-0 ring-1 ring-inset ring-white/10`}>
            <IconComponent className={`w-4 h-4 text-${config.color}`} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <button 
                onClick={handleAuthorClick}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                {activity.avatarUrl && (
                  <img src={activity.avatarUrl} alt="" className="w-5 h-5 rounded-full ring-2 ring-void-600" />
                )}
                <span className="text-sm font-semibold text-frost-100 hover:text-electric-400 transition-colors">
                  {activity.author}
                </span>
              </button>
              
              <span className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full font-medium">
                {activity.repo}
              </span>
              
              <span className={`text-xs px-2 py-0.5 ${config.bg} text-${config.color} rounded-full font-medium`}>
                {config.label}
              </span>
              
              {activity.number && (
                <span className="text-xs text-frost-300/50 font-mono">#{activity.number}</span>
              )}
              
              {activity.branch && (
                <span className="text-xs px-2 py-0.5 bg-teal-400/20 text-teal-400 rounded-full flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />{activity.branch}
                </span>
              )}
              
              {activity.tagName && (
                <span className="text-xs px-2 py-0.5 bg-blue-400/20 text-blue-400 rounded-full flex items-center gap-1">
                  <Tag className="w-3 h-3" />{activity.tagName}
                </span>
              )}
            </div>
            
            {/* Message/Body */}
            <div className="text-sm text-frost-200 leading-relaxed">
              {getDescription()}
            </div>
            
            {/* Labels */}
            {activity.labels && activity.labels.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {activity.labels.map(l => (
                  <span 
                    key={l.name} 
                    className="text-xs px-2 py-0.5 rounded-full" 
                    style={{ backgroundColor: `#${l.color}30`, color: `#${l.color}` }}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            )}
            
            {/* Code path for review comments */}
            {activity.path && (
              <div className="mt-2 text-xs font-mono text-frost-300/50 bg-void-900/50 px-2 py-1 rounded">
                {activity.path}{activity.line ? `:${activity.line}` : ''}
              </div>
            )}
            
            {/* Footer */}
            <div className="flex items-center gap-4 mt-3 text-xs text-frost-300/60">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(activity.date), 'MMM d, h:mm a')}
              </span>
              
              {activity.shortSha && (
                <span className="font-mono bg-void-700/50 px-2 py-0.5 rounded">{activity.shortSha}</span>
              )}
              
              {activity.commitCount && activity.commitCount > 1 && (
                <span className="text-neon-green">{activity.commitCount} commits</span>
              )}
              
              {activity.additions !== undefined && (
                <span className="text-neon-green">+{activity.additions}</span>
              )}
              
              {activity.deletions !== undefined && (
                <span className="text-red-400">-{activity.deletions}</span>
              )}
              
              {activity.changedFiles && (
                <span className="text-frost-300/50">{activity.changedFiles} files</span>
              )}
              
              {activity.prAuthor && activity.prAuthor !== activity.author && (
                <span className="text-frost-300/50">on @{activity.prAuthor}'s PR</span>
              )}
            </div>
          </div>
          
          {/* External Link */}
          {activity.url && (
            <a 
              href={activity.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 hover:bg-void-600/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            >
              <ExternalLink className="w-4 h-4 text-frost-300/60 hover:text-electric-400" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityCard

