import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import { 
  GitCommit, GitPullRequest, ExternalLink, GitMerge, Clock, MessageSquare, 
  FileCode, Plus, Minus, Eye, CheckCircle, XCircle, AlertCircle, 
  GitBranch, Tag, Rocket, MessageCircle, User
} from 'lucide-react'

// ============ ACTIVITY TYPE CONFIGURATION ============
const ACTIVITY_CONFIG = {
  commit: {
    icon: GitCommit,
    label: 'Commit',
    color: 'electric-400',
    bgColor: 'bg-electric-400/15',
    borderColor: 'border-electric-400/30',
    glowClass: 'group-hover:shadow-[0_0_25px_rgba(56,189,248,0.3)]',
  },
  pr: {
    icon: GitPullRequest,
    label: 'Pull Request',
    color: 'purple-400',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
    glowClass: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
  },
  merge: {
    icon: GitMerge,
    label: 'Merged',
    color: 'fuchsia-400',
    bgColor: 'bg-fuchsia-500/15',
    borderColor: 'border-fuchsia-500/30',
    glowClass: 'group-hover:shadow-[0_0_25px_rgba(217,70,239,0.3)]',
  },
  review: {
    icon: Eye,
    label: 'Review',
    color: 'cyan-400',
    bgColor: 'bg-cyan-400/15',
    borderColor: 'border-cyan-400/30',
    glowClass: 'group-hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]',
  },
  comment: {
    icon: MessageSquare,
    label: 'Comment',
    color: 'yellow-400',
    bgColor: 'bg-yellow-400/15',
    borderColor: 'border-yellow-400/30',
    glowClass: 'group-hover:shadow-[0_0_25px_rgba(250,204,21,0.3)]',
  },
  branch: {
    icon: GitBranch,
    label: 'Branch',
    color: 'teal-400',
    bgColor: 'bg-teal-400/15',
    borderColor: 'border-teal-400/30',
    glowClass: 'group-hover:shadow-[0_0_25px_rgba(45,212,191,0.3)]',
  },
  tag: {
    icon: Tag,
    label: 'Tag',
    color: 'blue-400',
    bgColor: 'bg-blue-400/15',
    borderColor: 'border-blue-400/30',
    glowClass: 'group-hover:shadow-[0_0_25px_rgba(96,165,250,0.3)]',
  },
  release: {
    icon: Rocket,
    label: 'Release',
    color: 'pink-400',
    bgColor: 'bg-pink-500/15',
    borderColor: 'border-pink-500/30',
    glowClass: 'group-hover:shadow-[0_0_25px_rgba(236,72,153,0.3)]',
  },
}

function groupActivitiesByDate(activities) {
  const groups = {}
  
  for (const activity of activities) {
    const date = new Date(activity.date)
    let key
    
    if (isToday(date)) {
      key = 'Today'
    } else if (isYesterday(date)) {
      key = 'Yesterday'
    } else if (isThisWeek(date)) {
      key = format(date, 'EEEE') // Day name
    } else {
      key = format(date, 'MMMM d, yyyy')
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(activity)
  }
  
  return groups
}

function ActivityCard({ activity }) {
  const isCommit = activity.type === 'commit'
  const isPR = activity.type === 'pr'
  
  // Get config or default to commit
  const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.commit
  
  // Special handling for PR states
  let displayConfig = config
  if (isPR && activity.state === 'merged') {
    displayConfig = ACTIVITY_CONFIG.merge
  }
  
  const Icon = displayConfig.icon

  const getPRStateColor = (state) => {
    switch (state) {
      case 'merged':
        return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30'
      case 'open':
        return 'bg-neon-green/20 text-neon-green border-neon-green/30'
      case 'closed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-frost-300/20 text-frost-300 border-frost-300/30'
    }
  }

  return (
    <a
      href={activity.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="relative pl-14 pb-8">
        {/* Timeline node */}
        <div className={`absolute left-0 top-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${displayConfig.bgColor} text-${displayConfig.color} ${displayConfig.glowClass} group-hover:scale-110 border ${displayConfig.borderColor}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Card */}
        <div className={`bg-void-700/40 hover:bg-void-700/60 border border-void-600/50 hover:border-${displayConfig.color}/40 rounded-2xl p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-${displayConfig.color}/10`}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              {/* Tags row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-1 bg-void-600/60 text-electric-400 rounded-lg text-xs font-mono font-medium">
                  {activity.repo}
                </span>
                
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${displayConfig.bgColor} text-${displayConfig.color}`}>
                  {displayConfig.label}
                </span>
                
                {isPR && (
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-medium border capitalize ${getPRStateColor(activity.state)}`}>
                    {activity.state}
                  </span>
                )}
                
                {isPR && activity.draft && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-xs font-medium">
                    Draft
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h3 className="text-frost-100 font-medium text-base leading-relaxed group-hover:text-white transition-colors">
                {isPR && <span className="text-frost-300/50 font-normal">#{activity.number} </span>}
                {activity.message}
              </h3>
              
              {/* Body preview for comments/reviews */}
              {activity.body && (
                <p className="mt-2 text-sm text-frost-300/60 line-clamp-2 leading-relaxed border-l-2 border-frost-300/20 pl-3 italic">
                  "{activity.body.slice(0, 150)}{activity.body.length > 150 ? '...' : ''}"
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-frost-300/30 group-hover:text-electric-400 transition-colors" />
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-frost-300/60">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
            </span>
            
            <span className="text-frost-300/30">•</span>
            
            <span className="text-frost-300/50">
              {format(new Date(activity.date), 'MMM d, h:mm a')}
            </span>
            
            {isCommit && activity.shortSha && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="font-mono text-electric-400/80 bg-electric-400/10 px-2 py-0.5 rounded">
                  {activity.shortSha}
                </span>
              </>
            )}
            
            {activity.branch && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-void-600/50 rounded-lg font-mono text-frost-300/70">
                  <GitBranch className="w-3 h-3" />
                  {activity.branch}
                  {activity.baseBranch && (
                    <>
                      <span className="text-frost-300/30">→</span>
                      {activity.baseBranch}
                    </>
                  )}
                </span>
              </>
            )}
            
            {(activity.additions !== undefined || activity.deletions !== undefined) && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="flex items-center gap-2">
                  {activity.additions !== undefined && (
                    <span className="flex items-center gap-0.5 text-neon-green font-medium">
                      <Plus className="w-3 h-3" />
                      {activity.additions}
                    </span>
                  )}
                  {activity.deletions !== undefined && (
                    <span className="flex items-center gap-0.5 text-red-400 font-medium">
                      <Minus className="w-3 h-3" />
                      {activity.deletions}
                    </span>
                  )}
                </span>
              </>
            )}
            
            {activity.changedFiles !== undefined && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="flex items-center gap-1 text-frost-300/60">
                  <FileCode className="w-3 h-3" />
                  {activity.changedFiles} files
                </span>
              </>
            )}
            
            {isPR && (activity.comments > 0 || activity.reviewComments > 0) && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="flex items-center gap-1 text-yellow-400/80">
                  <MessageSquare className="w-3 h-3" />
                  {(activity.comments || 0) + (activity.reviewComments || 0)}
                </span>
              </>
            )}
            
            {activity.author && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="flex items-center gap-1.5 text-frost-300/60">
                  {activity.avatarUrl ? (
                    <img src={activity.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {activity.author}
                </span>
              </>
            )}
          </div>

          {/* Labels */}
          {isPR && activity.labels && activity.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {activity.labels.map((label) => (
                <span
                  key={label.name}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: `#${label.color}20`,
                    color: `#${label.color}`,
                    borderColor: `#${label.color}40`,
                    borderWidth: '1px',
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

export function Timeline({ activities }) {
  const groupedActivities = groupActivitiesByDate(activities)
  
  return (
    <div className="space-y-6">
      {Object.entries(groupedActivities).map(([date, dateActivities], groupIndex) => (
        <div 
          key={date} 
          className="animate-fade-in"
          style={{ animationDelay: `${groupIndex * 80}ms` }}
        >
          {/* Date header */}
          <div className="sticky top-[73px] z-10 py-4 backdrop-blur-xl bg-void-900/80">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-electric-400/60 via-electric-400/30 to-transparent" />
              <div className="flex items-center gap-3 px-4 py-2 bg-electric-400/10 border border-electric-400/30 rounded-xl">
                <h2 className="text-sm font-bold text-electric-400 font-display tracking-wide">
                  {date}
                </h2>
                <span className="px-2.5 py-1 bg-electric-400/20 text-electric-400 rounded-lg text-xs font-semibold">
                  {dateActivities.length}
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-electric-400/60 via-electric-400/30 to-transparent" />
            </div>
          </div>

          {/* Activities */}
          <div className="relative mt-2">
            {/* Connecting line */}
            <div className="absolute left-5 top-0 bottom-8 w-0.5 bg-gradient-to-b from-electric-400/40 via-electric-400/20 to-transparent rounded-full" />
            
            {dateActivities.map((activity, index) => (
              <div 
                key={activity.id}
                className="animate-slide-up"
                style={{ animationDelay: `${(groupIndex * 80) + (index * 40)}ms` }}
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Bottom fade */}
      <div className="h-20" />
    </div>
  )
}
