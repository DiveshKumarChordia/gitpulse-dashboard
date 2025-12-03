import { useState, useEffect, useMemo } from 'react'
import { 
  Users, GitCommit, GitPullRequest, MessageSquare, Eye, Loader2, 
  ExternalLink, Calendar, ChevronDown, Folder, Trophy, Medal, Award,
  AlertTriangle, Flame, Activity, Crown, Building, UserCheck, X,
  GitMerge, CheckCircle, XCircle, Clock, AlertCircle, Code, FileCode,
  ChevronRight, ArrowLeft, Filter, TrendingUp, Zap
} from 'lucide-react'
import { fetchUserTeams, fetchTeamMembers, fetchTeamRepos, fetchTeamRepoActivities, fetchSingleRepoActivities, fetchTeamMemberActivities } from '../api/github'
import { useToast } from './Toast'
import { format, subDays, subMonths, isAfter, isSameDay, startOfDay, eachDayOfInterval, formatDistanceToNow } from 'date-fns'

// ============ CONSTANTS ============
const TIME_FILTERS = [
  { key: 'today', label: 'Today', getDate: () => startOfDay(new Date()) },
  { key: 'week', label: 'Last Week', getDate: () => subDays(new Date(), 7) },
  { key: 'month', label: 'Last Month', getDate: () => subMonths(new Date(), 1) },
  { key: '3months', label: '3 Months', getDate: () => subMonths(new Date(), 3) },
  { key: '6months', label: '6 Months', getDate: () => subMonths(new Date(), 6) },
  { key: 'year', label: 'This Year', getDate: () => new Date(new Date().getFullYear(), 0, 1) },
  { key: 'all', label: 'All Time', getDate: () => null },
]

const LEADERBOARD_METRICS = [
  { key: 'total', label: 'Total Activity', icon: Activity },
  { key: 'commits', label: 'Commits', icon: GitCommit },
  { key: 'prs', label: 'Pull Requests', icon: GitPullRequest },
  { key: 'reviews', label: 'Code Reviews', icon: Eye },
  { key: 'comments', label: 'Comments', icon: MessageSquare },
  { key: 'approvals', label: 'Approvals', icon: CheckCircle },
  { key: 'linesAdded', label: 'Lines Added', icon: Code },
  { key: 'reposActive', label: 'Repos Active', icon: Folder },
]

const ACTIVITY_CONFIG = {
  commit: { icon: GitCommit, color: 'text-neon-green', bg: 'bg-neon-green/10', gradient: 'from-neon-green/20 to-neon-green/5', label: 'Commit' },
  pr: { icon: GitPullRequest, color: 'text-purple-400', bg: 'bg-purple-500/10', gradient: 'from-purple-500/20 to-purple-500/5', label: 'PR' },
  merge: { icon: GitMerge, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', gradient: 'from-fuchsia-500/20 to-fuchsia-500/5', label: 'Merged' },
  review: { icon: Eye, color: 'text-electric-400', bg: 'bg-electric-400/10', gradient: 'from-electric-400/20 to-electric-400/5', label: 'Review' },
  comment: { icon: MessageSquare, color: 'text-yellow-400', bg: 'bg-yellow-400/10', gradient: 'from-yellow-400/20 to-yellow-400/5', label: 'Comment' },
  approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', gradient: 'from-green-500/20 to-green-500/5', label: 'Approved' },
  changes_requested: { icon: XCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', gradient: 'from-orange-500/20 to-orange-500/5', label: 'Changes Requested' },
}

// ============ DETAILED ACTIVITY CARD ============
function ActivityCard({ activity, onMemberClick, animate = false }) {
  const type = activity.subType || activity.type
  const config = ACTIVITY_CONFIG[type] || ACTIVITY_CONFIG.commit
  const Icon = config.icon
  
  const getDescription = () => {
    switch (activity.type) {
      case 'commit': return activity.fullMessage || activity.message
      case 'pr': return `${activity.state === 'merged' ? '🎉 Merged' : activity.state === 'open' ? '📬 Opened' : '❌ Closed'} PR: ${activity.message}`
      case 'merge': return activity.message
      case 'review': return activity.message + (activity.body ? ` - "${activity.body.slice(0, 100)}${activity.body.length > 100 ? '...' : ''}"` : '')
      case 'comment': return activity.body ? `"${activity.body.slice(0, 150)}${activity.body.length > 150 ? '...' : ''}"` : activity.message
      default: return activity.message
    }
  }
  
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-void-600/50 bg-gradient-to-r ${config.gradient} hover:border-frost-300/30 transition-all duration-300 ${animate ? 'animate-fadeIn' : ''}`}>
      <div className="absolute inset-0 bg-void-800/50 backdrop-blur-sm" />
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 ${config.bg} rounded-xl flex-shrink-0 ring-1 ring-inset ring-white/10`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <button 
                onClick={() => onMemberClick?.(activity.author)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                {activity.avatarUrl && <img src={activity.avatarUrl} alt="" className="w-5 h-5 rounded-full ring-2 ring-void-600" />}
                <span className="text-sm font-semibold text-frost-100 hover:text-electric-400 transition-colors">{activity.author}</span>
              </button>
              <span className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full font-medium">{activity.repo}</span>
              <span className={`text-xs px-2 py-0.5 ${config.bg} ${config.color} rounded-full font-medium`}>{config.label}</span>
              {activity.number && <span className="text-xs text-frost-300/50 font-mono">#{activity.number}</span>}
            </div>
            
            <p className="text-sm text-frost-200 leading-relaxed">{getDescription()}</p>
            
            {activity.labels && activity.labels.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {activity.labels.map(l => (
                  <span key={l.name} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `#${l.color}30`, color: `#${l.color}` }}>{l.name}</span>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-xs text-frost-300/60">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(activity.date), 'MMM d, h:mm a')}</span>
              {activity.shortSha && <span className="font-mono bg-void-700/50 px-2 py-0.5 rounded">{activity.shortSha}</span>}
              {activity.additions !== undefined && (
                <span className="text-neon-green">+{activity.additions}</span>
              )}
              {activity.deletions !== undefined && (
                <span className="text-red-400">-{activity.deletions}</span>
              )}
            </div>
          </div>
          
          <a href={activity.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-void-600/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
            <ExternalLink className="w-4 h-4 text-frost-300/60 hover:text-electric-400" />
          </a>
        </div>
      </div>
    </div>
  )
}

// ============ TEAM MEMBERS MODAL ============
function TeamMembersModal({ members, onClose, onSelectMember }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-void-900/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-void-800 border border-void-600/50 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
        <div className="flex items-center justify-between p-6 border-b border-void-600/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl"><Users className="w-5 h-5 text-purple-400" /></div>
            <div>
              <h3 className="text-frost-100 font-bold text-lg">Team Members</h3>
              <p className="text-xs text-frost-300/60">{members.length} members • Click to view profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-void-700 rounded-lg"><X className="w-5 h-5 text-frost-300/60" /></button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map(member => (
              <button
                key={member.login}
                onClick={() => onSelectMember(member)}
                className="flex items-center gap-4 p-4 bg-void-700/30 border border-void-600/50 rounded-xl hover:border-purple-400/50 hover:bg-purple-500/5 transition-all group"
              >
                <img src={member.avatarUrl} alt="" className="w-12 h-12 rounded-full ring-2 ring-void-600 group-hover:ring-purple-400/50" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-frost-100 group-hover:text-purple-400 transition-colors">{member.login}</p>
                  <p className="text-xs text-frost-300/60">View activity profile →</p>
                </div>
                <ChevronRight className="w-5 h-5 text-frost-300/40 group-hover:text-purple-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ MEMBER PROFILE VIEW ============
function MemberProfileView({ member, token, org, onBack }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('month')
  const toast = useToast()
  
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchTeamMemberActivities(token, org, [member], () => {})
        setActivities(data.activities)
        setStats(data.memberStats[0] || null)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [member, token, org])
  
  const filteredActivities = useMemo(() => {
    const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
    if (!filterDate) return activities
    return activities.filter(a => isAfter(new Date(a.date), filterDate))
  }, [activities, timeFilter])
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-void-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-frost-300/60" />
        </button>
        <img src={member.avatarUrl} alt="" className="w-16 h-16 rounded-full ring-4 ring-purple-500/30" />
        <div>
          <h2 className="text-2xl font-bold text-frost-100">{member.login}</h2>
          <p className="text-frost-300/60">Activity Profile</p>
        </div>
        <a href={member.url || `https://github.com/${member.login}`} target="_blank" rel="noopener noreferrer" className="ml-auto px-4 py-2 bg-void-700/50 hover:bg-void-700 rounded-lg text-frost-300/60 hover:text-frost-200 transition-all flex items-center gap-2">
          <ExternalLink className="w-4 h-4" /> GitHub Profile
        </a>
      </div>
      
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" /></div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Commits', value: stats.commits, icon: GitCommit, color: 'neon-green' },
                { label: 'PRs', value: stats.prs, icon: GitPullRequest, color: 'purple-400' },
                { label: 'Reviews', value: stats.reviews, icon: Eye, color: 'electric-400' },
                { label: 'Comments', value: stats.comments, icon: MessageSquare, color: 'yellow-400' },
                { label: 'Repos', value: stats.reposActive, icon: Folder, color: 'orange-400' },
                { label: 'Total', value: stats.total, icon: Zap, color: 'frost-100' },
              ].map(s => (
                <div key={s.label} className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 text-center">
                  <s.icon className={`w-5 h-5 text-${s.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-frost-100">{s.value}</p>
                  <p className="text-xs text-frost-300/50">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            {TIME_FILTERS.slice(0, 5).map(f => (
              <button key={f.key} onClick={() => setTimeFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${timeFilter === f.key ? 'bg-purple-500 text-white' : 'bg-void-700/50 text-frost-300/60 hover:text-frost-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
          
          <div className="space-y-3">
            <h3 className="text-frost-100 font-semibold flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Activity ({filteredActivities.length})</h3>
            {filteredActivities.slice(0, 50).map((a, i) => <ActivityCard key={a.id} activity={a} animate={i < 10} />)}
            {filteredActivities.length === 0 && <p className="text-center py-8 text-frost-300/50">No activity in this period</p>}
          </div>
        </>
      )}
    </div>
  )
}

// ============ ADVANCED LEADERBOARD ============
function AdvancedLeaderboard({ stats, activities, title }) {
  const [metric, setMetric] = useState('total')
  const [timeFilter, setTimeFilter] = useState('month')
  
  const filteredStats = useMemo(() => {
    if (!activities || !stats) return stats || []
    const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
    if (!filterDate) return stats
    
    // Recalculate from activities
    const recalc = {}
    stats.forEach(s => {
      recalc[s.login] = { ...s, commits: 0, prs: 0, reviews: 0, comments: 0, approvals: 0, merges: 0, linesAdded: 0, reposActive: new Set() }
    })
    
    activities.forEach(a => {
      if (isAfter(new Date(a.date), filterDate) && recalc[a.author]) {
        const s = recalc[a.author]
        if (a.type === 'commit') { s.commits++; s.linesAdded += (a.stats?.additions || 0) }
        else if (a.type === 'pr') s.prs++
        else if (a.type === 'merge') s.merges++
        else if (a.type === 'review') { s.reviews++; if (a.subType === 'approved') s.approvals++ }
        else if (a.type === 'comment') s.comments++
        if (a.repo) s.reposActive.add(a.repo)
      }
    })
    
    return Object.values(recalc).map(s => ({
      ...s,
      reposActive: typeof s.reposActive === 'object' ? s.reposActive.size : s.reposActive,
      total: s.commits + s.prs + s.reviews + s.comments,
    }))
  }, [stats, activities, timeFilter])
  
  const sorted = useMemo(() => {
    return [...filteredStats].sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
  }, [filteredStats, metric])
  
  const getRank = (i) => {
    if (i === 0) return { icon: Crown, color: 'text-yellow-400', ring: 'ring-yellow-400/50' }
    if (i === 1) return { icon: Medal, color: 'text-gray-300', ring: 'ring-gray-400/50' }
    if (i === 2) return { icon: Award, color: 'text-orange-400', ring: 'ring-orange-400/50' }
    return { icon: null, color: 'text-frost-300/60', ring: 'ring-void-600' }
  }
  
  const MetricIcon = LEADERBOARD_METRICS.find(m => m.key === metric)?.icon || Activity
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-void-600/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-frost-100 font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" />{title}</h3>
        </div>
        
        {/* Metric Selector */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {LEADERBOARD_METRICS.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${metric === m.key ? 'bg-electric-400 text-void-900 font-semibold' : 'bg-void-700/50 text-frost-300/60 hover:text-frost-200'}`}>
              <m.icon className="w-3 h-3" />{m.label}
            </button>
          ))}
        </div>
        
        {/* Time Selector */}
        <div className="flex flex-wrap gap-1">
          {TIME_FILTERS.map(f => (
            <button key={f.key} onClick={() => setTimeFilter(f.key)}
              className={`px-2 py-1 rounded text-xs transition-all ${timeFilter === f.key ? 'bg-purple-500/20 text-purple-400' : 'text-frost-300/50 hover:text-frost-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
        {sorted.slice(0, 15).map((s, i) => {
          const rank = getRank(i)
          const RankIcon = rank.icon
          const value = s[metric] || 0
          
          return (
            <div key={s.login} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${i < 3 ? 'bg-gradient-to-r from-void-700/50 to-transparent border-void-500/50' : 'bg-void-800/30 border-transparent hover:border-void-600/50'}`}>
              <div className="w-7 flex justify-center">
                {RankIcon ? <RankIcon className={`w-5 h-5 ${rank.color}`} /> : <span className="text-sm font-mono text-frost-300/40">#{i + 1}</span>}
              </div>
              <img src={s.avatarUrl} alt="" className={`w-9 h-9 rounded-full ring-2 ${rank.ring}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-frost-100 text-sm truncate">{s.login}</span>
                  {s.isInactive && <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">Inactive</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-frost-300/50">
                  <span className="flex items-center gap-1 text-neon-green"><GitCommit className="w-3 h-3" />{s.commits}</span>
                  <span className="flex items-center gap-1 text-purple-400"><GitPullRequest className="w-3 h-3" />{s.prs}</span>
                  <span className="flex items-center gap-1 text-electric-400"><Eye className="w-3 h-3" />{s.reviews}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <MetricIcon className="w-4 h-4 text-frost-300/40" />
                  <span className="text-xl font-bold text-frost-100">{value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )
        })}
        {sorted.length === 0 && <p className="text-center py-8 text-frost-300/50">No data available</p>}
      </div>
    </div>
  )
}

// ============ REPO SELECTOR ============
function RepoSelector({ repos, selectedRepo, onSelect }) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2 bg-void-700/50 border border-void-600/50 rounded-xl hover:border-yellow-400/30 transition-all">
        <Folder className="w-4 h-4 text-yellow-400" />
        <span className="text-frost-200 text-sm font-medium">{selectedRepo?.name || 'All Repos'}</span>
        <ChevronDown className={`w-4 h-4 text-frost-300/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          <button onClick={() => { onSelect(null); setOpen(false) }} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-void-700/50 transition-colors ${!selectedRepo ? 'bg-yellow-400/10' : ''}`}>
            <Folder className="w-4 h-4 text-yellow-400" />
            <span className="text-frost-200 text-sm">All Repos</span>
          </button>
          <div className="max-h-64 overflow-y-auto border-t border-void-600/30">
            {repos.map(repo => (
              <button key={repo.name} onClick={() => { onSelect(repo); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-void-700/50 transition-colors ${selectedRepo?.name === repo.name ? 'bg-yellow-400/10' : ''}`}>
                <Folder className="w-4 h-4 text-frost-300/60" />
                <span className="text-frost-200 text-sm truncate">{repo.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ HEATMAP ============
function ActivityHeatmap({ activities, selectedDate, onDateSelect }) {
  const today = new Date()
  const startDate = subMonths(today, 3)
  
  const activityMap = useMemo(() => {
    const map = {}
    activities?.forEach(a => { const k = format(new Date(a.date), 'yyyy-MM-dd'); map[k] = (map[k] || 0) + 1 })
    return map
  }, [activities])
  
  const days = eachDayOfInterval({ start: startDate, end: today })
  const maxCount = Math.max(...Object.values(activityMap), 1)
  
  const getColor = (count) => {
    if (!count) return 'bg-void-700/30'
    const r = count / maxCount
    if (r < 0.25) return 'bg-electric-400/20'
    if (r < 0.5) return 'bg-electric-400/40'
    if (r < 0.75) return 'bg-electric-400/60'
    return 'bg-electric-400'
  }
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-frost-100 font-medium flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /> Activity Heatmap</span>
        {selectedDate && <button onClick={() => onDateSelect(null)} className="text-xs text-electric-400 hover:text-electric-500 px-2 py-1 bg-electric-400/10 rounded">Clear: {format(selectedDate, 'MMM d')}</button>}
      </div>
      <div className="flex gap-0.5 flex-wrap">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const count = activityMap[key] || 0
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          return (
            <button key={key} onClick={() => onDateSelect(day)} title={`${format(day, 'MMM d')}: ${count} activities`}
              className={`w-3 h-3 rounded-sm transition-all ${getColor(count)} ${isSelected ? 'ring-2 ring-electric-400 ring-offset-1 ring-offset-void-900' : 'hover:ring-1 hover:ring-frost-300/30'}`} />
          )
        })}
      </div>
      <div className="flex items-center justify-end gap-1 mt-3 text-xs text-frost-300/50">
        Less <div className="flex gap-0.5">
          <div className="w-3 h-3 bg-void-700/30 rounded-sm" />
          <div className="w-3 h-3 bg-electric-400/20 rounded-sm" />
          <div className="w-3 h-3 bg-electric-400/40 rounded-sm" />
          <div className="w-3 h-3 bg-electric-400/60 rounded-sm" />
          <div className="w-3 h-3 bg-electric-400 rounded-sm" />
        </div> More
      </div>
    </div>
  )
}

// ============ TEAM REPOS SECTION ============
function TeamReposSection({ token, org, repos, onMemberClick }) {
  const [allActivities, setAllActivities] = useState([])
  const [allStats, setAllStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const toast = useToast()
  
  // Load all repos initially
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchTeamRepoActivities(token, org, repos, setProgress)
        setAllActivities(data.activities)
        setAllStats(data.contributorStats)
        toast.success(`Loaded ${data.activities.length} activities`)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoading(false)
        setProgress(null)
      }
    }
    load()
  }, [token, org, repos])
  
  // Load single repo when selected
  const [repoActivities, setRepoActivities] = useState([])
  const [repoStats, setRepoStats] = useState([])
  const [loadingRepo, setLoadingRepo] = useState(false)
  
  useEffect(() => {
    if (!selectedRepo) {
      setRepoActivities([])
      setRepoStats([])
      return
    }
    const load = async () => {
      setLoadingRepo(true)
      try {
        const data = await fetchSingleRepoActivities(token, org, selectedRepo.name, setProgress)
        setRepoActivities(data.activities)
        setRepoStats(data.contributorStats)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoadingRepo(false)
      }
    }
    load()
  }, [selectedRepo, token, org])
  
  const activities = selectedRepo ? repoActivities : allActivities
  const stats = selectedRepo ? repoStats : allStats
  const isLoading = loading || loadingRepo
  
  const filteredActivities = useMemo(() => {
    let filtered = activities
    if (selectedDate) filtered = filtered.filter(a => isSameDay(new Date(a.date), selectedDate))
    if (typeFilter !== 'all') filtered = filtered.filter(a => a.type === typeFilter || a.subType === typeFilter)
    return filtered
  }, [activities, selectedDate, typeFilter])
  
  if (loading) return (
    <div className="text-center py-16">
      <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mx-auto mb-4" />
      <p className="text-frost-300/60 text-lg">{progress?.status || 'Loading...'}</p>
      {progress?.percentage > 0 && (
        <div className="max-w-sm mx-auto mt-4 h-2 bg-void-600/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all" style={{ width: `${progress.percentage}%` }} />
        </div>
      )}
    </div>
  )
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <RepoSelector repos={repos} selectedRepo={selectedRepo} onSelect={setSelectedRepo} />
        
        <div className="flex items-center gap-1 p-1 bg-void-700/30 rounded-lg">
          {[{ key: 'all', label: 'All' }, { key: 'commit', label: 'Commits' }, { key: 'pr', label: 'PRs' }, { key: 'merge', label: 'Merges' }, { key: 'review', label: 'Reviews' }, { key: 'comment', label: 'Comments' }].map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${typeFilter === t.key ? 'bg-yellow-400 text-void-900' : 'text-frost-300/60 hover:text-frost-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
        
        {loadingRepo && <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />}
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Commits', value: stats.reduce((a, s) => a + s.commits, 0), icon: GitCommit, color: 'neon-green' },
          { label: 'PRs', value: stats.reduce((a, s) => a + s.prs, 0), icon: GitPullRequest, color: 'purple-400' },
          { label: 'Reviews', value: stats.reduce((a, s) => a + s.reviews, 0), icon: Eye, color: 'electric-400' },
          { label: 'Approvals', value: stats.reduce((a, s) => a + (s.approvals || 0), 0), icon: CheckCircle, color: 'green-400' },
          { label: 'Comments', value: stats.reduce((a, s) => a + s.comments, 0), icon: MessageSquare, color: 'yellow-400' },
          { label: 'Contributors', value: stats.length, icon: Users, color: 'frost-100' },
        ].map(s => (
          <div key={s.label} className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 text-center">
            <s.icon className={`w-5 h-5 text-${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-frost-100">{s.value.toLocaleString()}</p>
            <p className="text-xs text-frost-300/50">{s.label}</p>
          </div>
        ))}
      </div>
      
      <ActivityHeatmap activities={activities} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-frost-100 font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-400" /> 
            Activity Feed
            <span className="text-xs px-2 py-0.5 bg-void-600/50 rounded-full text-frost-300/60">{filteredActivities.length}</span>
          </h3>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
            {filteredActivities.slice(0, 100).map((a, i) => (
              <ActivityCard key={a.id} activity={a} onMemberClick={onMemberClick} animate={i < 5} />
            ))}
            {filteredActivities.length === 0 && (
              <div className="text-center py-12 text-frost-300/50">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activities found</p>
              </div>
            )}
          </div>
        </div>
        
        <AdvancedLeaderboard stats={stats} activities={activities} title="Top Contributors" />
      </div>
    </div>
  )
}

// ============ TEAM MEMBERS SECTION ============
function TeamMembersSection({ token, org, members, onMemberClick }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const toast = useToast()
  
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchTeamMemberActivities(token, org, members, setProgress)
        setActivities(data.activities)
        setStats(data.memberStats)
        toast.success(`Loaded ${data.activities.length} member activities`)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoading(false)
        setProgress(null)
      }
    }
    load()
  }, [token, org, members])
  
  const filteredActivities = useMemo(() => {
    let filtered = activities
    if (selectedDate) filtered = filtered.filter(a => isSameDay(new Date(a.date), selectedDate))
    if (typeFilter !== 'all') filtered = filtered.filter(a => a.type === typeFilter)
    return filtered
  }, [activities, selectedDate, typeFilter])
  
  if (loading) return (
    <div className="text-center py-16">
      <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
      <p className="text-frost-300/60 text-lg">{progress?.status || 'Loading...'}</p>
    </div>
  )
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-1 bg-void-700/30 rounded-lg w-fit">
        {[{ key: 'all', label: 'All' }, { key: 'commit', label: 'Commits' }, { key: 'pr', label: 'PRs' }, { key: 'review', label: 'Reviews' }, { key: 'comment', label: 'Comments' }].map(t => (
          <button key={t.key} onClick={() => setTypeFilter(t.key)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${typeFilter === t.key ? 'bg-purple-500 text-white' : 'text-frost-300/60 hover:text-frost-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      
      <ActivityHeatmap activities={activities} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-frost-100 font-bold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-400" /> Member Activities
            <span className="text-xs px-2 py-0.5 bg-void-600/50 rounded-full text-frost-300/60">{filteredActivities.length}</span>
          </h3>
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
            {filteredActivities.slice(0, 100).map((a, i) => (
              <ActivityCard key={a.id} activity={a} onMemberClick={onMemberClick} animate={i < 5} />
            ))}
            {filteredActivities.length === 0 && <p className="text-center py-12 text-frost-300/50">No activities found</p>}
          </div>
        </div>
        
        <AdvancedLeaderboard stats={stats} activities={activities} title="Member Leaderboard" />
      </div>
    </div>
  )
}

// ============ MAIN COMPONENT ============
export function TeamsDashboard({ token, org }) {
  const [teams, setTeams] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [repos, setRepos] = useState([])
  const [loadingTeamData, setLoadingTeamData] = useState(false)
  const [activeSection, setActiveSection] = useState('repos')
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      if (!token || !org) return
      setLoadingTeams(true)
      try {
        const t = await fetchUserTeams(token, org)
        setTeams(t)
        if (t.length > 0) setSelectedTeam(t[0])
      } catch (e) { toast.apiError(e.message) }
      finally { setLoadingTeams(false) }
    }
    load()
  }, [token, org])

  useEffect(() => {
    const load = async () => {
      if (!selectedTeam) return
      setLoadingTeamData(true)
      setSelectedMember(null)
      try {
        const [m, r] = await Promise.all([
          fetchTeamMembers(token, org, selectedTeam.slug),
          fetchTeamRepos(token, org, selectedTeam.slug),
        ])
        setMembers(m)
        setRepos(r)
      } catch (e) { toast.apiError(e.message) }
      finally { setLoadingTeamData(false) }
    }
    load()
  }, [selectedTeam, token, org])

  const handleMemberClick = (login) => {
    const member = members.find(m => m.login === login)
    if (member) setSelectedMember(member)
  }

  if (!token || !org) return (
    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <p className="text-red-400">Please configure your organization first</p>
    </div>
  )

  // Member Profile View
  if (selectedMember) {
    return <MemberProfileView member={selectedMember} token={token} org={org} onBack={() => setSelectedMember(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-electric-400/10 via-purple-500/10 to-yellow-400/10 border border-electric-400/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-electric-400 to-purple-500 rounded-xl shadow-lg shadow-electric-400/25">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-frost-100 font-bold text-xl">Teams Analytics</h2>
            <p className="text-sm text-frost-300/60">Comprehensive team monitoring & insights</p>
          </div>
        </div>
        
        {/* Team Selector */}
        <div className="relative">
          <button onClick={() => document.getElementById('team-dropdown').classList.toggle('hidden')}
            className="flex items-center justify-between w-full px-5 py-4 bg-void-700/50 border border-void-600/50 rounded-xl hover:border-electric-400/30 transition-all">
            <div className="flex items-center gap-4">
              <Users className="w-6 h-6 text-electric-400" />
              <div className="text-left">
                <p className="text-frost-100 font-semibold text-lg">{selectedTeam?.name || 'Select Team'}</p>
                {selectedTeam && <p className="text-xs text-frost-300/60">{selectedTeam.membersCount || '?'} members • {selectedTeam.reposCount || '?'} repositories</p>}
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-frost-300/60" />
          </button>
          <div id="team-dropdown" className="hidden absolute top-full left-0 right-0 mt-2 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
            {loadingTeams ? (
              <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-electric-400" /></div>
            ) : teams.map(team => (
              <button key={team.slug} onClick={() => { setSelectedTeam(team); document.getElementById('team-dropdown').classList.add('hidden') }}
                className={`w-full flex items-center justify-between px-5 py-4 hover:bg-void-700/50 transition-colors ${selectedTeam?.slug === team.slug ? 'bg-electric-400/10' : ''}`}>
                <span className={`font-medium ${selectedTeam?.slug === team.slug ? 'text-electric-400' : 'text-frost-200'}`}>{team.name}</span>
                <span className="text-xs text-frost-300/60">{team.membersCount} members</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Info Cards */}
      {selectedTeam && !loadingTeamData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => setShowMembersModal(true)} className="bg-void-700/30 border border-void-600/50 rounded-xl p-5 text-center hover:border-purple-400/50 hover:bg-purple-500/5 transition-all group">
            <Users className="w-7 h-7 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-3xl font-bold text-frost-100">{members.length}</p>
            <p className="text-sm text-frost-300/60">Team Members</p>
            <p className="text-xs text-purple-400 mt-1">Click to view →</p>
          </button>
          <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-5 text-center">
            <Folder className="w-7 h-7 text-yellow-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-frost-100">{repos.length}</p>
            <p className="text-sm text-frost-300/60">Team Repos</p>
          </div>
          <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-5 text-center">
            <Code className="w-7 h-7 text-neon-green mx-auto mb-2" />
            <p className="text-3xl font-bold text-frost-100">{repos.filter(r => r.permissions?.push).length}</p>
            <p className="text-sm text-frost-300/60">Write Access</p>
          </div>
          <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-5 text-center">
            <FileCode className="w-7 h-7 text-electric-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-frost-100">{repos.filter(r => r.permissions?.admin).length}</p>
            <p className="text-sm text-frost-300/60">Admin Access</p>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      {selectedTeam && !loadingTeamData && (members.length > 0 || repos.length > 0) && (
        <div className="flex items-center gap-2 p-2 bg-void-700/30 rounded-xl border border-void-600/50 w-fit">
          <button onClick={() => setActiveSection('repos')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeSection === 'repos' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-void-900 shadow-lg shadow-yellow-400/25' : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'}`}>
            <Folder className="w-5 h-5" /> Team Repos <span className="text-xs px-2 py-0.5 rounded-full bg-void-900/20">{repos.length}</span>
          </button>
          <button onClick={() => setActiveSection('members')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeSection === 'members' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/25' : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'}`}>
            <Users className="w-5 h-5" /> Team Members <span className="text-xs px-2 py-0.5 rounded-full bg-void-900/20">{members.length}</span>
          </button>
        </div>
      )}

      {loadingTeamData && (
        <div className="text-center py-16"><Loader2 className="w-10 h-10 text-electric-400 animate-spin mx-auto mb-4" /><p className="text-frost-300/60">Loading team data...</p></div>
      )}

      {/* Content */}
      {selectedTeam && !loadingTeamData && activeSection === 'repos' && repos.length > 0 && (
        <TeamReposSection token={token} org={org} repos={repos} onMemberClick={handleMemberClick} />
      )}
      {selectedTeam && !loadingTeamData && activeSection === 'members' && members.length > 0 && (
        <TeamMembersSection token={token} org={org} members={members} onMemberClick={handleMemberClick} />
      )}

      {/* Modals */}
      {showMembersModal && (
        <TeamMembersModal members={members} onClose={() => setShowMembersModal(false)} onSelectMember={(m) => { setShowMembersModal(false); setSelectedMember(m) }} />
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}
