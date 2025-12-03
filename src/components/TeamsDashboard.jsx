import { useState, useEffect, useMemo } from 'react'
import { 
  Users, GitCommit, GitPullRequest, MessageSquare, Eye, Loader2, 
  ExternalLink, Calendar, ChevronDown, Folder, 
  Trophy, Medal, Award, TrendingUp, AlertTriangle,
  Flame, Activity, Crown, Building, UserCheck, BarChart3,
  GitBranch, Code2, Layers
} from 'lucide-react'
import { fetchUserTeams, fetchTeamMembers, fetchTeamRepos, fetchTeamRepoActivities, fetchTeamMemberActivities } from '../api/github'
import { useToast } from './Toast'
import { format, subDays, isAfter, isSameDay, startOfDay, eachDayOfInterval, subMonths } from 'date-fns'

// ============ CONSTANTS ============
const TIME_FILTERS = [
  { key: 'today', label: 'Today', getDate: () => startOfDay(new Date()) },
  { key: 'week', label: 'Last 7 Days', getDate: () => subDays(new Date(), 7) },
  { key: 'month', label: 'Last 30 Days', getDate: () => subDays(new Date(), 30) },
  { key: 'all', label: 'All Time', getDate: () => null },
]

const ACTIVITY_CONFIG = {
  commit: { icon: GitCommit, color: 'text-neon-green', bg: 'bg-neon-green/10', label: 'Commit' },
  pr: { icon: GitPullRequest, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'PR' },
  review: { icon: Eye, color: 'text-electric-400', bg: 'bg-electric-400/10', label: 'Review' },
  comment: { icon: MessageSquare, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Comment' },
}

// ============ ACTIVITY CARD ============
function ActivityCard({ activity }) {
  const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.commit
  const Icon = config.icon
  
  return (
    <div className="flex items-start gap-3 p-3 bg-void-700/30 border border-void-600/50 rounded-xl hover:border-frost-300/30 transition-all group">
      <div className={`p-2 ${config.bg} rounded-lg flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {activity.avatarUrl && <img src={activity.avatarUrl} alt="" className="w-4 h-4 rounded-full" />}
          <span className="text-xs font-medium text-frost-100">{activity.author}</span>
          <span className="text-xs px-1.5 py-0.5 bg-yellow-400/20 text-yellow-400 rounded">{activity.repo}</span>
          <span className={`text-xs px-1.5 py-0.5 ${config.bg} ${config.color} rounded`}>{config.label}</span>
        </div>
        <p className="text-sm text-frost-200 line-clamp-1">{activity.message}</p>
        <p className="text-xs text-frost-300/50 mt-1">{format(new Date(activity.date), 'MMM d, h:mm a')}</p>
      </div>
      <a href={activity.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-void-600/50 rounded-lg opacity-0 group-hover:opacity-100">
        <ExternalLink className="w-3.5 h-3.5 text-frost-300/60" />
      </a>
    </div>
  )
}

// ============ TEAM SELECTOR ============
function TeamSelector({ teams, selectedTeam, onSelect, loading }) {
  const [open, setOpen] = useState(false)
  
  if (loading) return (
    <div className="flex items-center gap-3 px-4 py-3 bg-void-700/30 border border-void-600/50 rounded-xl">
      <Loader2 className="w-5 h-5 text-electric-400 animate-spin" />
      <span className="text-frost-300/60">Loading teams...</span>
    </div>
  )
  
  if (teams.length === 0) return (
    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
      <AlertTriangle className="w-5 h-5 inline mr-2" />
      No teams found. Make sure you have team access in this organization.
    </div>
  )
  
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full px-4 py-3 bg-void-700/30 border border-void-600/50 rounded-xl hover:border-electric-400/30 transition-all">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-electric-400" />
          <span className="text-frost-100 font-medium">{selectedTeam?.name || 'Select Team'}</span>
          {selectedTeam && (
            <>
              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">{selectedTeam.membersCount || '?'} members</span>
              <span className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded">{selectedTeam.reposCount || '?'} repos</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-frost-300/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto">
          {teams.map(team => (
            <button key={team.slug} onClick={() => { onSelect(team); setOpen(false) }}
              className={`flex items-center justify-between w-full px-4 py-3 hover:bg-void-700/50 transition-colors ${selectedTeam?.slug === team.slug ? 'bg-electric-400/10' : ''}`}>
              <span className={selectedTeam?.slug === team.slug ? 'text-electric-400' : 'text-frost-200'}>{team.name}</span>
              <div className="flex items-center gap-2 text-xs text-frost-300/60">
                <span>{team.membersCount} members</span>
                <span>•</span>
                <span>{team.reposCount} repos</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ LEADERBOARD ============
function Leaderboard({ stats, title, showRepos = true }) {
  const getRank = (i) => {
    if (i === 0) return { icon: Crown, color: 'text-yellow-400', bg: 'from-yellow-400/10 to-orange-400/10 border-yellow-400/30' }
    if (i === 1) return { icon: Medal, color: 'text-gray-300', bg: 'from-gray-400/10 to-gray-500/10 border-gray-400/30' }
    if (i === 2) return { icon: Award, color: 'text-orange-400', bg: 'from-orange-400/10 to-red-400/10 border-orange-400/30' }
    return { icon: null, color: 'text-frost-300/60', bg: 'bg-void-700/30 border-void-600/50' }
  }
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-5">
      <h3 className="text-frost-100 font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" /> {title}
      </h3>
      <div className="space-y-2">
        {stats.slice(0, 10).map((s, i) => {
          const rank = getRank(i)
          const RankIcon = rank.icon
          return (
            <div key={s.login} className={`flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r ${rank.bg}`}>
              <div className="w-6 flex justify-center">
                {RankIcon ? <RankIcon className={`w-5 h-5 ${rank.color}`} /> : <span className="text-sm text-frost-300/60">#{i + 1}</span>}
              </div>
              {s.avatarUrl && <img src={s.avatarUrl} alt="" className="w-8 h-8 rounded-full" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-frost-100 text-sm truncate">{s.login}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-neon-green flex items-center gap-1"><GitCommit className="w-3 h-3" />{s.commits}</span>
                  <span className="text-purple-400 flex items-center gap-1"><GitPullRequest className="w-3 h-3" />{s.prs}</span>
                  {s.reviews > 0 && <span className="text-electric-400 flex items-center gap-1"><Eye className="w-3 h-3" />{s.reviews}</span>}
                  {s.comments > 0 && <span className="text-yellow-400 flex items-center gap-1"><MessageSquare className="w-3 h-3" />{s.comments}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-frost-100">{s.total}</p>
                {showRepos && <p className="text-xs text-frost-300/50">{s.reposActive} repos</p>}
              </div>
            </div>
          )
        })}
        {stats.length === 0 && <p className="text-center py-6 text-frost-300/50">No data yet</p>}
      </div>
    </div>
  )
}

// ============ MINI HEATMAP ============
function MiniHeatmap({ activities, selectedDate, onDateSelect }) {
  const today = new Date()
  const startDate = subMonths(today, 2)
  
  const activityMap = useMemo(() => {
    const map = {}
    activities?.forEach(a => {
      const key = format(new Date(a.date), 'yyyy-MM-dd')
      map[key] = (map[key] || 0) + 1
    })
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
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-frost-300/60 flex items-center gap-1"><Flame className="w-3 h-3" /> Activity Heatmap</span>
        {selectedDate && <button onClick={() => onDateSelect(null)} className="text-xs text-electric-400">Clear</button>}
      </div>
      <div className="flex gap-0.5 flex-wrap">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd')
          const count = activityMap[key] || 0
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          return (
            <button key={key} onClick={() => onDateSelect(day)} title={`${format(day, 'MMM d')}: ${count}`}
              className={`w-2.5 h-2.5 rounded-sm ${getColor(count)} ${isSelected ? 'ring-1 ring-electric-400' : ''}`} />
          )
        })}
      </div>
    </div>
  )
}

// ============ STATS CARDS ============
function StatsCards({ stats, activities, timeFilter }) {
  const filtered = useMemo(() => {
    const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
    if (!filterDate || !activities) return stats
    
    let commits = 0, prs = 0, reviews = 0, comments = 0
    activities.forEach(a => {
      if (isAfter(new Date(a.date), filterDate)) {
        if (a.type === 'commit') commits++
        else if (a.type === 'pr') prs++
        else if (a.type === 'review') reviews++
        else if (a.type === 'comment') comments++
      }
    })
    return { commits, prs, reviews, comments }
  }, [stats, activities, timeFilter])
  
  const cards = [
    { label: 'Commits', value: filtered.commits || 0, icon: GitCommit, color: 'neon-green' },
    { label: 'Pull Requests', value: filtered.prs || 0, icon: GitPullRequest, color: 'purple-400' },
    { label: 'Reviews', value: filtered.reviews || 0, icon: Eye, color: 'electric-400' },
    { label: 'Comments', value: filtered.comments || 0, icon: MessageSquare, color: 'yellow-400' },
  ]
  
  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="bg-void-700/30 border border-void-600/50 rounded-xl p-3 text-center">
          <c.icon className={`w-5 h-5 text-${c.color} mx-auto mb-1`} />
          <p className="text-2xl font-bold text-frost-100">{c.value}</p>
          <p className="text-xs text-frost-300/50">{c.label}</p>
        </div>
      ))}
    </div>
  )
}

// ============ SECTION: TEAM REPOS ============
function TeamReposSection({ token, org, repos, onBack }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [timeFilter, setTimeFilter] = useState('week')
  const [selectedDate, setSelectedDate] = useState(null)
  const toast = useToast()
  
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchTeamRepoActivities(token, org, repos, setProgress)
        setActivities(data.activities)
        setStats(data.contributorStats)
        toast.success(`Loaded ${data.activities.length} activities from ${repos.length} repos`)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoading(false)
        setProgress(null)
      }
    }
    load()
  }, [token, org, repos])
  
  const filteredActivities = useMemo(() => {
    let filtered = activities
    if (selectedDate) {
      filtered = filtered.filter(a => isSameDay(new Date(a.date), selectedDate))
    } else {
      const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
      if (filterDate) filtered = filtered.filter(a => isAfter(new Date(a.date), filterDate))
    }
    return filtered
  }, [activities, timeFilter, selectedDate])
  
  const totals = useMemo(() => {
    return stats.reduce((acc, s) => ({
      commits: acc.commits + s.commits,
      prs: acc.prs + s.prs,
      reviews: acc.reviews + (s.reviews || 0),
      comments: acc.comments + (s.comments || 0),
    }), { commits: 0, prs: 0, reviews: 0, comments: 0 })
  }, [stats])
  
  if (loading) return (
    <div className="text-center py-12">
      <Loader2 className="w-8 h-8 text-electric-400 animate-spin mx-auto mb-4" />
      <p className="text-frost-300/60">{progress?.status || 'Loading...'}</p>
      {progress?.percentage > 0 && (
        <div className="max-w-xs mx-auto mt-3 h-1.5 bg-void-600/50 rounded-full overflow-hidden">
          <div className="h-full bg-electric-400" style={{ width: `${progress.percentage}%` }} />
        </div>
      )}
    </div>
  )
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400/20 rounded-xl"><Folder className="w-5 h-5 text-yellow-400" /></div>
          <div>
            <h3 className="text-frost-100 font-semibold">Team Repositories Activity</h3>
            <p className="text-xs text-frost-300/60">All activities in {repos.length} team repos (by anyone)</p>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-void-700/30 rounded-lg">
          {TIME_FILTERS.map(f => (
            <button key={f.key} onClick={() => { setTimeFilter(f.key); setSelectedDate(null) }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${timeFilter === f.key && !selectedDate ? 'bg-electric-400 text-void-900' : 'text-frost-300/60 hover:text-frost-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      
      <StatsCards stats={totals} activities={activities} timeFilter={timeFilter} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <MiniHeatmap activities={activities} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {filteredActivities.slice(0, 100).map(a => <ActivityCard key={a.id} activity={a} />)}
            {filteredActivities.length === 0 && <p className="text-center py-8 text-frost-300/50">No activities in this period</p>}
          </div>
        </div>
        <Leaderboard stats={stats} title="Top Contributors" />
      </div>
    </div>
  )
}

// ============ SECTION: TEAM MEMBERS ============
function TeamMembersSection({ token, org, members }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [timeFilter, setTimeFilter] = useState('week')
  const [selectedDate, setSelectedDate] = useState(null)
  const toast = useToast()
  
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchTeamMemberActivities(token, org, members, setProgress)
        setActivities(data.activities)
        setStats(data.memberStats)
        toast.success(`Loaded ${data.activities.length} activities from ${members.length} members`)
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
    if (selectedDate) {
      filtered = filtered.filter(a => isSameDay(new Date(a.date), selectedDate))
    } else {
      const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
      if (filterDate) filtered = filtered.filter(a => isAfter(new Date(a.date), filterDate))
    }
    return filtered
  }, [activities, timeFilter, selectedDate])
  
  const totals = useMemo(() => {
    return stats.reduce((acc, s) => ({
      commits: acc.commits + s.commits,
      prs: acc.prs + s.prs,
      reviews: acc.reviews + (s.reviews || 0),
      comments: acc.comments + (s.comments || 0),
    }), { commits: 0, prs: 0, reviews: 0, comments: 0 })
  }, [stats])
  
  if (loading) return (
    <div className="text-center py-12">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
      <p className="text-frost-300/60">{progress?.status || 'Loading...'}</p>
      {progress?.percentage > 0 && (
        <div className="max-w-xs mx-auto mt-3 h-1.5 bg-void-600/50 rounded-full overflow-hidden">
          <div className="h-full bg-purple-400" style={{ width: `${progress.percentage}%` }} />
        </div>
      )}
    </div>
  )
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl"><UserCheck className="w-5 h-5 text-purple-400" /></div>
          <div>
            <h3 className="text-frost-100 font-semibold">Team Members Activity</h3>
            <p className="text-xs text-frost-300/60">All activities by {members.length} members (anywhere in org)</p>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-void-700/30 rounded-lg">
          {TIME_FILTERS.map(f => (
            <button key={f.key} onClick={() => { setTimeFilter(f.key); setSelectedDate(null) }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${timeFilter === f.key && !selectedDate ? 'bg-purple-400 text-void-900' : 'text-frost-300/60 hover:text-frost-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      
      <StatsCards stats={totals} activities={activities} timeFilter={timeFilter} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <MiniHeatmap activities={activities} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {filteredActivities.slice(0, 100).map(a => <ActivityCard key={a.id} activity={a} />)}
            {filteredActivities.length === 0 && <p className="text-center py-8 text-frost-300/50">No activities in this period</p>}
          </div>
        </div>
        <Leaderboard stats={stats} title="Member Leaderboard" />
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
  const [activeSection, setActiveSection] = useState('repos') // 'repos' | 'members'
  const toast = useToast()

  // Load teams
  useEffect(() => {
    const load = async () => {
      if (!token || !org) return
      setLoadingTeams(true)
      try {
        const t = await fetchUserTeams(token, org)
        setTeams(t)
        if (t.length > 0) setSelectedTeam(t[0])
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoadingTeams(false)
      }
    }
    load()
  }, [token, org])

  // Load team members & repos when team selected
  useEffect(() => {
    const load = async () => {
      if (!selectedTeam) return
      setLoadingTeamData(true)
      setMembers([])
      setRepos([])
      try {
        const [m, r] = await Promise.all([
          fetchTeamMembers(token, org, selectedTeam.slug),
          fetchTeamRepos(token, org, selectedTeam.slug),
        ])
        setMembers(m)
        setRepos(r)
        toast.info(`Team: ${m.length} members, ${r.length} repos`)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoadingTeamData(false)
      }
    }
    load()
  }, [selectedTeam, token, org])

  if (!token || !org) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400">Please configure your organization first</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-electric-400/10 via-purple-500/10 to-yellow-400/10 border border-electric-400/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-electric-400 to-purple-500 rounded-xl">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-frost-100 font-bold text-xl">Teams Analytics</h2>
            <p className="text-xs text-frost-300/60">Monitor team repos & member activities</p>
          </div>
        </div>
        <TeamSelector teams={teams} selectedTeam={selectedTeam} onSelect={setSelectedTeam} loading={loadingTeams} />
      </div>

      {/* Team Info */}
      {selectedTeam && !loadingTeamData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-frost-100">{members.length}</p>
            <p className="text-xs text-frost-300/60">Team Members</p>
          </div>
          <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 text-center">
            <Folder className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-frost-100">{repos.length}</p>
            <p className="text-xs text-frost-300/60">Team Repos</p>
          </div>
          <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 text-center">
            <Code2 className="w-6 h-6 text-neon-green mx-auto mb-2" />
            <p className="text-2xl font-bold text-frost-100">{repos.filter(r => r.permissions?.push).length}</p>
            <p className="text-xs text-frost-300/60">Write Access</p>
          </div>
          <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 text-center">
            <Layers className="w-6 h-6 text-electric-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-frost-100">{repos.filter(r => r.permissions?.admin).length}</p>
            <p className="text-xs text-frost-300/60">Admin Access</p>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      {selectedTeam && !loadingTeamData && (members.length > 0 || repos.length > 0) && (
        <div className="flex items-center gap-2 p-1.5 bg-void-700/30 rounded-xl border border-void-600/50 w-fit">
          <button onClick={() => setActiveSection('repos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${activeSection === 'repos' ? 'bg-yellow-400 text-void-900' : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'}`}>
            <Folder className="w-4 h-4" />
            Team Repos
            <span className="text-xs px-1.5 py-0.5 rounded bg-void-900/20">{repos.length}</span>
          </button>
          <button onClick={() => setActiveSection('members')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${activeSection === 'members' ? 'bg-purple-500 text-white' : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'}`}>
            <Users className="w-4 h-4" />
            Team Members
            <span className="text-xs px-1.5 py-0.5 rounded bg-void-900/20">{members.length}</span>
          </button>
        </div>
      )}

      {/* Loading team data */}
      {loadingTeamData && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-electric-400 animate-spin mx-auto mb-4" />
          <p className="text-frost-300/60">Loading team members and repositories...</p>
        </div>
      )}

      {/* Content Sections */}
      {selectedTeam && !loadingTeamData && activeSection === 'repos' && repos.length > 0 && (
        <TeamReposSection token={token} org={org} repos={repos} />
      )}
      {selectedTeam && !loadingTeamData && activeSection === 'members' && members.length > 0 && (
        <TeamMembersSection token={token} org={org} members={members} />
      )}

      {/* Empty states */}
      {selectedTeam && !loadingTeamData && repos.length === 0 && activeSection === 'repos' && (
        <div className="text-center py-12 bg-void-700/30 border border-void-600/50 rounded-xl">
          <Folder className="w-12 h-12 text-frost-300/30 mx-auto mb-4" />
          <p className="text-frost-300/60">This team has no repositories</p>
        </div>
      )}
      {selectedTeam && !loadingTeamData && members.length === 0 && activeSection === 'members' && (
        <div className="text-center py-12 bg-void-700/30 border border-void-600/50 rounded-xl">
          <Users className="w-12 h-12 text-frost-300/30 mx-auto mb-4" />
          <p className="text-frost-300/60">This team has no members</p>
        </div>
      )}
    </div>
  )
}
