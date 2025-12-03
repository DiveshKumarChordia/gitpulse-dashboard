import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import { GitCommit, GitPullRequest, ExternalLink, GitMerge, Clock, MessageSquare, FileCode, Plus, Minus } from 'lucide-react'

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
  
  const getPRStateColor = (state) => {
    switch (state) {
      case 'merged':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'open':
        return 'bg-neon-green/20 text-neon-green border-neon-green/30'
      case 'closed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-frost-300/20 text-frost-300 border-frost-300/30'
    }
  }

  const getPRStateIcon = (state) => {
    if (state === 'merged') return GitMerge
    return GitPullRequest
  }

  const StateIcon = isPR ? getPRStateIcon(activity.state) : GitCommit

  return (
    <a
      href={activity.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="relative pl-12 pb-6">
        {/* Timeline node */}
        <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${
          isCommit 
            ? 'bg-electric-400/20 text-electric-400 group-hover:glow-blue' 
            : activity.state === 'merged' 
              ? 'bg-purple-500/20 text-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : activity.state === 'open'
                ? 'bg-neon-green/20 text-neon-green group-hover:glow-green'
                : 'bg-red-500/20 text-red-400'
        }`}>
          <StateIcon className="w-5 h-5" />
        </div>

        {/* Card */}
        <div className="bg-void-700/30 hover:bg-void-700/50 border border-void-600/50 hover:border-electric-400/30 rounded-xl p-4 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-electric-400/5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-void-600/50 text-electric-400 rounded text-xs font-mono">
                  {activity.repo}
                </span>
                {isPR && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${getPRStateColor(activity.state)}`}>
                    {activity.state}
                  </span>
                )}
                {isPR && activity.draft && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs font-medium">
                    Draft
                  </span>
                )}
              </div>
              <h3 className="text-frost-100 font-medium leading-snug group-hover:text-electric-400 transition-colors">
                {isPR && <span className="text-frost-300/60">#{activity.number} </span>}
                {activity.message}
              </h3>
            </div>
            <ExternalLink className="w-4 h-4 text-frost-300/40 group-hover:text-electric-400 flex-shrink-0 transition-colors" />
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-frost-300/60">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
            </span>
            
            {isCommit && (
              <span className="font-mono text-electric-400/70">
                {activity.shortSha}
              </span>
            )}
            
            {activity.branch && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-void-600/50 rounded font-mono">
                {activity.branch}
                {activity.baseBranch && (
                  <>
                    <span className="text-frost-300/40">→</span>
                    {activity.baseBranch}
                  </>
                )}
              </span>
            )}
            
            {(activity.additions !== undefined || activity.deletions !== undefined) && (
              <span className="flex items-center gap-2">
                {activity.additions !== undefined && (
                  <span className="flex items-center gap-0.5 text-neon-green">
                    <Plus className="w-3 h-3" />
                    {activity.additions}
                  </span>
                )}
                {activity.deletions !== undefined && (
                  <span className="flex items-center gap-0.5 text-red-400">
                    <Minus className="w-3 h-3" />
                    {activity.deletions}
                  </span>
                )}
              </span>
            )}
            
            {activity.changedFiles !== undefined && (
              <span className="flex items-center gap-1">
                <FileCode className="w-3 h-3" />
                {activity.changedFiles} files
              </span>
            )}
            
            {isPR && (activity.comments > 0 || activity.reviewComments > 0) && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {(activity.comments || 0) + (activity.reviewComments || 0)}
              </span>
            )}
          </div>

          {/* Labels */}
          {isPR && activity.labels && activity.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {activity.labels.map((label) => (
                <span
                  key={label.name}
                  className="px-2 py-0.5 rounded text-xs font-medium"
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
    <div className="space-y-8">
      {Object.entries(groupedActivities).map(([date, dateActivities], groupIndex) => (
        <div 
          key={date} 
          className="animate-fade-in"
          style={{ animationDelay: `${groupIndex * 100}ms` }}
        >
          {/* Date header */}
          <div className="sticky top-[73px] z-10 py-3 backdrop-blur-xl bg-void-900/80">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-electric-400/50 to-transparent" />
              <h2 className="text-sm font-semibold text-electric-400 font-display">
                {date}
              </h2>
              <span className="px-2 py-0.5 bg-electric-400/10 text-electric-400/70 rounded-full text-xs">
                {dateActivities.length} {dateActivities.length === 1 ? 'activity' : 'activities'}
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-electric-400/50 to-transparent" />
            </div>
          </div>

          {/* Activities */}
          <div className="relative mt-4">
            {/* Connecting line */}
            <div className="absolute left-5 top-0 bottom-6 w-0.5 bg-gradient-to-b from-electric-400/30 via-electric-400/10 to-transparent" />
            
            {dateActivities.map((activity, index) => (
              <div 
                key={activity.id}
                className="animate-slide-up"
                style={{ animationDelay: `${(groupIndex * 100) + (index * 50)}ms` }}
              >
                <ActivityCard activity={activity} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

