/**
 * Member Profile View Component
 * Enhanced activity profile matching Home > Activity styling
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  ArrowLeft, ExternalLink, Loader2, GitCommit, GitPullRequest, 
  Eye, MessageSquare, Folder, Zap, GitMerge, Rocket, Clock,
  GitBranch, Tag, CheckCircle, Filter, Plus, Minus, FileCode,
  Calendar, TrendingUp, Award, Activity as ActivityIcon
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, isAfter } from 'date-fns'
import { fetchUserEvents, calculateStatsFromActivities, ACTIVITY_TYPES, ACTIVITY_CONFIG as API_ACTIVITY_CONFIG, DEFAULT_ACTIVITY_CONFIG } from '../../api/github/activities'
import { Heatmap } from './Heatmap'
import { TIME_FILTERS } from './Leaderboard'

// ============ ACTIVITY TYPE CONFIGURATION (Matching Home Timeline) ============
const ACTIVITY_CONFIG = {
  commit: { icon: GitCommit, label: 'Commit', color: 'electric-400', bgColor: 'bg-electric-400/15', borderColor: 'border-electric-400/30' },
  push: { icon: GitCommit, label: 'Push', color: 'neon-green', bgColor: 'bg-neon-green/15', borderColor: 'border-neon-green/30' },
  pr_opened: { icon: GitPullRequest, label: 'PR Opened', color: 'purple-400', bgColor: 'bg-purple-500/15', borderColor: 'border-purple-500/30' },
  pr_merged: { icon: GitMerge, label: 'PR Merged', color: 'fuchsia-400', bgColor: 'bg-fuchsia-500/15', borderColor: 'border-fuchsia-500/30' },
  pr_closed: { icon: GitPullRequest, label: 'PR Closed', color: 'red-400', bgColor: 'bg-red-500/15', borderColor: 'border-red-500/30' },
  review_approved: { icon: CheckCircle, label: 'Approved', color: 'green-400', bgColor: 'bg-green-500/15', borderColor: 'border-green-500/30' },
  review_changes_requested: { icon: Eye, label: 'Changes Requested', color: 'orange-400', bgColor: 'bg-orange-500/15', borderColor: 'border-orange-500/30' },
  review_commented: { icon: Eye, label: 'Review', color: 'cyan-400', bgColor: 'bg-cyan-400/15', borderColor: 'border-cyan-400/30' },
  pr_comment: { icon: MessageSquare, label: 'Comment', color: 'yellow-400', bgColor: 'bg-yellow-400/15', borderColor: 'border-yellow-400/30' },
  issue_comment: { icon: MessageSquare, label: 'Comment', color: 'yellow-400', bgColor: 'bg-yellow-400/15', borderColor: 'border-yellow-400/30' },
  branch_created: { icon: GitBranch, label: 'Branch Created', color: 'teal-400', bgColor: 'bg-teal-400/15', borderColor: 'border-teal-400/30' },
  branch_deleted: { icon: GitBranch, label: 'Branch Deleted', color: 'red-400', bgColor: 'bg-red-500/15', borderColor: 'border-red-500/30' },
  tag_created: { icon: Tag, label: 'Tag Created', color: 'blue-400', bgColor: 'bg-blue-400/15', borderColor: 'border-blue-400/30' },
  release_published: { icon: Rocket, label: 'Release', color: 'pink-400', bgColor: 'bg-pink-500/15', borderColor: 'border-pink-500/30' },
}

// ============ FILTER OPTIONS ============
const TYPE_FILTERS = [
  { key: 'all', label: 'All', icon: ActivityIcon },
  { key: 'commits', label: 'Commits', icon: GitCommit, types: ['commit', 'push'] },
  { key: 'prs', label: 'PRs', icon: GitPullRequest, types: ['pr_opened', 'pr_merged', 'pr_closed'] },
  { key: 'reviews', label: 'Reviews', icon: Eye, types: ['review_approved', 'review_changes_requested', 'review_commented'] },
  { key: 'comments', label: 'Comments', icon: MessageSquare, types: ['pr_comment', 'issue_comment', 'commit_comment'] },
  { key: 'branches', label: 'Branches', icon: GitBranch, types: ['branch_created', 'branch_deleted'] },
  { key: 'releases', label: 'Releases', icon: Rocket, types: ['release_published', 'tag_created'] },
]

// ============ GROUP BY DATE ============
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
      key = format(date, 'EEEE')
    } else {
      key = format(date, 'MMMM d, yyyy')
    }
    
    if (!groups[key]) groups[key] = []
    groups[key].push(activity)
  }
  
  return groups
}

// ============ ACTIVITY CARD (Matching Home Timeline Style) ============
function ProfileActivityCard({ activity }) {
  const config = ACTIVITY_CONFIG[activity.type] || { 
    icon: ActivityIcon, 
    label: 'Activity', 
    color: 'frost-300', 
    bgColor: 'bg-frost-300/15', 
    borderColor: 'border-frost-300/30' 
  }
  const Icon = config.icon

  return (
    <a
      href={activity.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <div className="relative pl-14 pb-8">
        {/* Timeline node */}
        <div className={`absolute left-0 top-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${config.bgColor} text-${config.color} group-hover:scale-110 border ${config.borderColor} group-hover:shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Card */}
        <div className={`bg-void-700/40 hover:bg-void-700/60 border border-void-600/50 hover:border-${config.color}/40 rounded-2xl p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl`}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              {/* Tags row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-1 bg-void-600/60 text-electric-400 rounded-lg text-xs font-mono font-medium">
                  {activity.repo}
                </span>
                
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${config.bgColor} text-${config.color}`}>
                  {config.label}
                </span>
                
                {activity.number && (
                  <span className="text-xs text-frost-300/50 font-mono">
                    #{activity.number}
                  </span>
                )}
                
                {activity.branch && (
                  <span className="px-2 py-0.5 bg-teal-400/15 text-teal-400 rounded-lg text-xs flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {activity.branch}
                  </span>
                )}
                
                {activity.tagName && (
                  <span className="px-2 py-0.5 bg-blue-400/15 text-blue-400 rounded-lg text-xs flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {activity.tagName}
                  </span>
                )}
              </div>
              
              {/* Title */}
              <h3 className="text-frost-100 font-medium text-base leading-relaxed group-hover:text-white transition-colors">
                {activity.message}
              </h3>
              
              {/* Body preview */}
              {activity.body && (
                <p className="mt-3 text-sm text-frost-300/60 leading-relaxed border-l-2 border-frost-300/20 pl-3 italic">
                  "{activity.body.slice(0, 200)}{activity.body.length > 200 ? '...' : ''}"
                </p>
              )}
              
              {/* Push commits */}
              {activity.commits && activity.commits.length > 0 && (
                <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-neon-green/30">
                  {activity.commits.slice(0, 3).map(commit => (
                    <p key={commit.sha} className="text-xs text-frost-300/60 font-mono">
                      • {commit.message?.split('\n')[0].slice(0, 60)}
                    </p>
                  ))}
                  {activity.commits.length > 3 && (
                    <p className="text-xs text-frost-300/40">+{activity.commits.length - 3} more commits</p>
                  )}
                </div>
              )}
            </div>
            
            <ExternalLink className="w-4 h-4 text-frost-300/30 group-hover:text-electric-400 transition-colors flex-shrink-0" />
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
            
            {activity.shortSha && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="font-mono text-electric-400/80 bg-electric-400/10 px-2 py-0.5 rounded">
                  {activity.shortSha}
                </span>
              </>
            )}
            
            {activity.commitCount && activity.commitCount > 1 && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="text-neon-green font-medium">{activity.commitCount} commits</span>
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
            
            {activity.changedFiles && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="flex items-center gap-1 text-frost-300/60">
                  <FileCode className="w-3 h-3" />
                  {activity.changedFiles} files
                </span>
              </>
            )}
            
            {activity.prAuthor && activity.prAuthor !== activity.author && (
              <>
                <span className="text-frost-300/30">•</span>
                <span className="text-frost-300/50">on @{activity.prAuthor}'s PR</span>
              </>
            )}
          </div>

          {/* Labels */}
          {activity.labels && activity.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {activity.labels.map(label => (
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

// ============ MAIN COMPONENT ============
export function MemberProfile({ member, token, org, onBack }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeFilter, setTimeFilter] = useState('month')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(null)
  
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const userActivities = await fetchUserEvents(token, member.login)
        setActivities(userActivities)
        
        const allStats = calculateStatsFromActivities(userActivities)
        setStats(allStats.find(s => s.login === member.login) || null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [member, token])
  
  const filteredActivities = useMemo(() => {
    let filtered = activities
    
    // Time filter
    const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
    if (filterDate) {
      filtered = filtered.filter(a => isAfter(new Date(a.date), filterDate))
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      const typeConfig = TYPE_FILTERS.find(f => f.key === typeFilter)
      if (typeConfig?.types) {
        filtered = filtered.filter(a => typeConfig.types.includes(a.type))
      }
    }
    
    // Date filter from heatmap
    if (selectedDate) {
      const dateStr = selectedDate.toDateString()
      filtered = filtered.filter(a => new Date(a.date).toDateString() === dateStr)
    }
    
    return filtered
  }, [activities, timeFilter, typeFilter, selectedDate])
  
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(filteredActivities)
  }, [filteredActivities])
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-electric-400/10 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="p-3 hover:bg-void-700/50 rounded-xl transition-colors border border-void-600/50 hover:border-purple-400/30"
          >
            <ArrowLeft className="w-5 h-5 text-frost-300/60 hover:text-frost-200" />
          </button>
          
          <img 
            src={member.avatarUrl} 
            alt="" 
            className="w-20 h-20 rounded-2xl ring-4 ring-purple-500/30 shadow-xl shadow-purple-500/20" 
          />
          
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-frost-100 mb-1">{member.login}</h2>
            <p className="text-frost-300/60 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              Activity Profile • {org}
            </p>
          </div>
          
          <a 
            href={member.url || `https://github.com/${member.login}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-5 py-3 bg-void-700/50 hover:bg-void-700 rounded-xl text-frost-200 transition-all flex items-center gap-2 border border-void-600/50 hover:border-purple-400/30"
          >
            <ExternalLink className="w-4 h-4" /> 
            GitHub Profile
          </a>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-frost-100 text-lg font-medium">Loading activity...</p>
          <p className="text-frost-300/50 text-sm mt-2">Fetching all GitHub events for @{member.login}</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-400 bg-red-500/10 border border-red-500/30 rounded-2xl">
          <p className="text-lg font-medium">Error loading profile</p>
          <p className="text-sm mt-2 text-red-300/60">{error}</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                { label: 'Commits', value: stats.commits, icon: GitCommit, color: 'neon-green' },
                { label: 'PRs', value: stats.prs, icon: GitPullRequest, color: 'purple-400' },
                { label: 'Merges', value: stats.merges || 0, icon: GitMerge, color: 'fuchsia-400' },
                { label: 'Reviews', value: stats.reviews, icon: Eye, color: 'cyan-400' },
                { label: 'Comments', value: stats.comments, icon: MessageSquare, color: 'yellow-400' },
                { label: 'Releases', value: stats.releases || 0, icon: Rocket, color: 'pink-400' },
                { label: 'Repos', value: stats.reposActive, icon: Folder, color: 'orange-400' },
                { label: 'Total', value: stats.total, icon: Zap, color: 'electric-400' },
              ].map(s => (
                <div key={s.label} className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 text-center hover:border-void-500/50 transition-all group">
                  <s.icon className={`w-5 h-5 text-${s.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                  <p className="text-2xl font-bold text-frost-100">{s.value}</p>
                  <p className="text-xs text-frost-300/50">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-void-700/30 border border-void-600/50 rounded-xl">
            {/* Time Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-frost-300/40" />
              <div className="flex gap-1">
                {TIME_FILTERS.slice(0, 5).map(f => (
                  <button 
                    key={f.key} 
                    onClick={() => setTimeFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeFilter === f.key 
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                        : 'bg-void-600/50 text-frost-300/60 hover:text-frost-200 hover:bg-void-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-6 w-px bg-void-600/50" />
            
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-frost-300/40" />
              <div className="flex gap-1">
                {TYPE_FILTERS.map(f => (
                  <button 
                    key={f.key} 
                    onClick={() => setTypeFilter(f.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      typeFilter === f.key 
                        ? 'bg-electric-400 text-void-900 shadow-lg shadow-electric-400/25' 
                        : 'bg-void-600/50 text-frost-300/60 hover:text-frost-200 hover:bg-void-600'
                    }`}
                  >
                    <f.icon className="w-3 h-3" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Heatmap */}
          <Heatmap 
            activities={activities} 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate}
            months={4}
          />
          
          {/* Activity Timeline - Matching Home Style */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-frost-100 font-bold text-xl flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-electric-400" />
                Activity Timeline
              </h3>
              <span className="px-4 py-2 bg-electric-400/10 text-electric-400 rounded-xl text-sm font-semibold">
                {filteredActivities.length} activities
              </span>
            </div>
            
            {/* Timeline */}
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
                    <div className="absolute left-5 top-0 bottom-8 w-0.5 bg-gradient-to-b from-electric-400/40 via-electric-400/20 to-transparent rounded-full" />
                    
                    {dateActivities.map((activity, index) => (
                      <div 
                        key={activity.id}
                        className="animate-slide-up"
                        style={{ animationDelay: `${(groupIndex * 80) + (index * 40)}ms` }}
                      >
                        <ProfileActivityCard activity={activity} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-20 bg-void-700/20 border border-void-600/50 rounded-2xl">
                  <ActivityIcon className="w-16 h-16 text-frost-300/20 mx-auto mb-4" />
                  <p className="text-frost-100 text-lg font-medium">No activities found</p>
                  <p className="text-frost-300/50 text-sm mt-2">Try changing the filters or time range</p>
                </div>
              )}
            </div>
            
            {/* Bottom fade */}
            <div className="h-12" />
          </div>
        </>
      )}
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out both; }
        .animate-slide-up { animation: slideUp 0.4s ease-out both; }
      `}</style>
    </div>
  )
}

export default MemberProfile
