import { useState, useEffect, useMemo } from 'react'
import { 
  Users, GitCommit, GitPullRequest, MessageSquare, Eye, Loader2, 
  ExternalLink, Calendar, ChevronDown, ChevronRight, Folder, Star,
  Trophy, Medal, Award, TrendingUp, AlertTriangle, RefreshCw, Filter,
  Flame, Target, Activity, BarChart3, Crown
} from 'lucide-react'
import { fetchUserTeams, fetchTeamMembers, fetchTeamActivities } from '../api/github'
import { useToast } from './Toast'
import { format, subDays, subWeeks, subMonths, isAfter, isSameDay, startOfDay, eachDayOfInterval } from 'date-fns'

// ============ ACTIVITY TYPE ICONS ============
const ACTIVITY_ICONS = {
  commit: { icon: GitCommit, color: 'text-neon-green', bg: 'bg-neon-green/10' },
  pr: { icon: GitPullRequest, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  review: { icon: Eye, color: 'text-electric-400', bg: 'bg-electric-400/10' },
  comment: { icon: MessageSquare, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
}

// ============ TIME FILTERS ============
const TIME_FILTERS = [
  { key: 'today', label: 'Today', getDate: () => startOfDay(new Date()) },
  { key: 'week', label: 'Last 7 Days', getDate: () => subDays(new Date(), 7) },
  { key: 'month', label: 'Last 30 Days', getDate: () => subDays(new Date(), 30) },
  { key: 'all', label: 'All Time', getDate: () => null },
]

// ============ ACTIVITY CARD ============
function ActivityCard({ activity, org }) {
  const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.commit
  const Icon = config.icon
  
  const getActivityDescription = () => {
    switch (activity.type) {
      case 'commit':
        return activity.message
      case 'pr':
        return `${activity.state === 'merged' ? 'Merged' : activity.state === 'open' ? 'Opened' : 'Closed'} PR: ${activity.message}`
      case 'review':
        return activity.message
      case 'comment':
        return activity.message
      default:
        return activity.message
    }
  }
  
  return (
    <div className="flex items-start gap-3 p-4 bg-void-700/30 border border-void-600/50 rounded-xl hover:border-frost-300/30 transition-all group">
      <div className={`p-2 ${config.bg} rounded-lg flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {activity.avatarUrl && (
            <img src={activity.avatarUrl} alt={activity.author} className="w-5 h-5 rounded-full" />
          )}
          <span className="text-sm font-medium text-frost-100">{activity.author}</span>
          <span className="text-xs text-frost-300/40">•</span>
          <span className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded">{activity.repo}</span>
        </div>
        <p className="text-sm text-frost-200 line-clamp-2">{getActivityDescription()}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-frost-300/60">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(activity.date), 'MMM d, h:mm a')}
          </span>
          {activity.shortSha && (
            <span className="font-mono">{activity.shortSha}</span>
          )}
        </div>
      </div>
      
      <a 
        href={activity.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="p-2 hover:bg-void-600/50 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
      >
        <ExternalLink className="w-4 h-4 text-frost-300/60 hover:text-electric-400" />
      </a>
    </div>
  )
}

// ============ TEAM SELECTOR ============
function TeamSelector({ teams, selectedTeam, onSelect, loading }) {
  const [open, setOpen] = useState(false)
  
  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-void-700/30 border border-void-600/50 rounded-xl">
        <Loader2 className="w-5 h-5 text-electric-400 animate-spin" />
        <span className="text-frost-300/60">Loading teams...</span>
      </div>
    )
  }
  
  if (teams.length === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <span className="text-yellow-400">No teams found in this organization</span>
      </div>
    )
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 w-full px-4 py-3 bg-void-700/30 border border-void-600/50 rounded-xl hover:border-frost-300/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-electric-400" />
          <span className="text-frost-100 font-medium">
            {selectedTeam ? selectedTeam.name : 'Select a team'}
          </span>
          {selectedTeam && (
            <span className="text-xs px-2 py-0.5 bg-void-600/50 text-frost-300/60 rounded">
              {selectedTeam.membersCount || '?'} members
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-frost-300/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl overflow-hidden z-50">
          {teams.map(team => (
            <button
              key={team.slug}
              onClick={() => { onSelect(team); setOpen(false) }}
              className={`flex items-center justify-between w-full px-4 py-3 hover:bg-void-700/50 transition-colors ${
                selectedTeam?.slug === team.slug ? 'bg-electric-400/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-4 h-4 ${selectedTeam?.slug === team.slug ? 'text-electric-400' : 'text-frost-300/60'}`} />
                <span className={`font-medium ${selectedTeam?.slug === team.slug ? 'text-electric-400' : 'text-frost-200'}`}>
                  {team.name}
                </span>
              </div>
              <span className="text-xs text-frost-300/60">{team.membersCount || '?'} members</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ LEADERBOARD ============
function Leaderboard({ memberStats, timeFilter, activities }) {
  const filteredStats = useMemo(() => {
    if (!activities || !memberStats) return memberStats || []
    
    const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
    
    if (!filterDate) return memberStats
    
    // Recalculate stats based on filtered activities
    const statsMap = {}
    memberStats.forEach(m => {
      statsMap[m.login] = {
        ...m,
        commits: 0,
        prs: 0,
        reviews: 0,
        comments: 0,
        reposActive: new Set(),
      }
    })
    
    activities.forEach(a => {
      if (isAfter(new Date(a.date), filterDate) && statsMap[a.author]) {
        const s = statsMap[a.author]
        if (a.type === 'commit') s.commits++
        else if (a.type === 'pr') s.prs++
        else if (a.type === 'review') s.reviews++
        else if (a.type === 'comment') s.comments++
        if (a.repo) s.reposActive.add(a.repo)
      }
    })
    
    return Object.values(statsMap).map(s => ({
      ...s,
      reposActive: s.reposActive.size,
      total: s.commits + s.prs + s.reviews + s.comments,
    }))
  }, [memberStats, timeFilter, activities])
  
  const sorted = useMemo(() => {
    return [...filteredStats].sort((a, b) => b.total - a.total)
  }, [filteredStats])
  
  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-400" />
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300" />
    if (index === 2) return <Award className="w-5 h-5 text-orange-400" />
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-frost-300/60">#{index + 1}</span>
  }
  
  const getRankBg = (index) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border-yellow-400/30'
    if (index === 1) return 'bg-gradient-to-r from-gray-300/10 to-gray-400/10 border-gray-400/30'
    if (index === 2) return 'bg-gradient-to-r from-orange-400/10 to-red-400/10 border-orange-400/30'
    return 'bg-void-700/30 border-void-600/50'
  }
  
  return (
    <div className="space-y-3">
      {sorted.map((member, index) => (
        <div 
          key={member.login}
          className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankBg(index)}`}
        >
          <div className="flex-shrink-0">
            {getRankIcon(index)}
          </div>
          
          <img 
            src={member.avatarUrl} 
            alt={member.login} 
            className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-void-600/50"
          />
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-frost-100 truncate">{member.login}</p>
            <div className="flex items-center gap-4 mt-1 text-xs">
              <span className="flex items-center gap-1 text-neon-green">
                <GitCommit className="w-3 h-3" /> {member.commits}
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <GitPullRequest className="w-3 h-3" /> {member.prs}
              </span>
              <span className="flex items-center gap-1 text-electric-400">
                <Eye className="w-3 h-3" /> {member.reviews}
              </span>
              <span className="flex items-center gap-1 text-yellow-400">
                <MessageSquare className="w-3 h-3" /> {member.comments}
              </span>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-frost-100">{member.total}</p>
            <p className="text-xs text-frost-300/60">{member.reposActive} repos</p>
          </div>
        </div>
      ))}
      
      {sorted.length === 0 && (
        <div className="text-center py-8 text-frost-300/60">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No activity data available</p>
        </div>
      )}
    </div>
  )
}

// ============ TEAM HEATMAP ============
function TeamHeatmap({ activities, selectedDate, onDateSelect }) {
  const today = new Date()
  const startDate = subMonths(today, 3)
  
  const activityMap = useMemo(() => {
    const map = {}
    if (!activities) return map
    
    activities.forEach(a => {
      const dateKey = format(new Date(a.date), 'yyyy-MM-dd')
      map[dateKey] = (map[dateKey] || 0) + 1
    })
    return map
  }, [activities])
  
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today })
  }, [startDate, today])
  
  const weeks = useMemo(() => {
    const w = []
    let currentWeek = []
    
    // Fill in empty days at start
    const firstDayOfWeek = days[0].getDay()
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null)
    }
    
    for (const day of days) {
      currentWeek.push(day)
      if (day.getDay() === 6) {
        w.push(currentWeek)
        currentWeek = []
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null)
      w.push(currentWeek)
    }
    
    return w
  }, [days])
  
  const maxCount = Math.max(...Object.values(activityMap), 1)
  
  const getIntensity = (count) => {
    if (count === 0) return 'bg-void-700/50'
    const ratio = count / maxCount
    if (ratio < 0.25) return 'bg-electric-400/20'
    if (ratio < 0.5) return 'bg-electric-400/40'
    if (ratio < 0.75) return 'bg-electric-400/60'
    return 'bg-electric-400'
  }
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-electric-400/10 rounded-xl">
            <Flame className="w-5 h-5 text-electric-400" />
          </div>
          <div>
            <h3 className="text-frost-100 font-semibold">Team Activity Heatmap</h3>
            <p className="text-xs text-frost-300/60">Last 3 months of activity</p>
          </div>
        </div>
        {selectedDate && (
          <button 
            onClick={() => onDateSelect(null)}
            className="text-xs text-frost-300/60 hover:text-frost-200 px-3 py-1.5 bg-void-600/50 rounded-lg"
          >
            Clear: {format(selectedDate, 'MMM d')}
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="w-3 h-3" />
                
                const dateKey = format(day, 'yyyy-MM-dd')
                const count = activityMap[dateKey] || 0
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                
                return (
                  <button
                    key={di}
                    onClick={() => onDateSelect(day)}
                    className={`w-3 h-3 rounded-sm transition-all ${getIntensity(count)} ${
                      isSelected ? 'ring-2 ring-electric-400 ring-offset-1 ring-offset-void-900' : 'hover:ring-1 hover:ring-frost-300/30'
                    }`}
                    title={`${format(day, 'MMM d, yyyy')}: ${count} activities`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs text-frost-300/60">
        <span>Less</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-void-700/50 rounded-sm" />
          <div className="w-3 h-3 bg-electric-400/20 rounded-sm" />
          <div className="w-3 h-3 bg-electric-400/40 rounded-sm" />
          <div className="w-3 h-3 bg-electric-400/60 rounded-sm" />
          <div className="w-3 h-3 bg-electric-400 rounded-sm" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

// ============ STATS CARDS ============
function TeamStats({ memberStats, timeFilter, activities }) {
  const stats = useMemo(() => {
    if (!memberStats) return { commits: 0, prs: 0, reviews: 0, comments: 0, members: 0 }
    
    const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
    
    let commits = 0, prs = 0, reviews = 0, comments = 0
    
    if (!filterDate) {
      memberStats.forEach(m => {
        commits += m.commits
        prs += m.prs
        reviews += m.reviews
        comments += m.comments
      })
    } else if (activities) {
      activities.forEach(a => {
        if (isAfter(new Date(a.date), filterDate)) {
          if (a.type === 'commit') commits++
          else if (a.type === 'pr') prs++
          else if (a.type === 'review') reviews++
          else if (a.type === 'comment') comments++
        }
      })
    }
    
    return { commits, prs, reviews, comments, members: memberStats.length }
  }, [memberStats, timeFilter, activities])
  
  const cards = [
    { label: 'Commits', value: stats.commits, icon: GitCommit, color: 'neon-green' },
    { label: 'Pull Requests', value: stats.prs, icon: GitPullRequest, color: 'purple-400' },
    { label: 'Reviews', value: stats.reviews, icon: Eye, color: 'electric-400' },
    { label: 'Comments', value: stats.comments, icon: MessageSquare, color: 'yellow-400' },
  ]
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="bg-void-700/30 border border-void-600/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={`w-4 h-4 text-${card.color}`} />
            <span className="text-xs text-frost-300/60">{card.label}</span>
          </div>
          <p className="text-2xl font-bold text-frost-100">{card.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

// ============ MAIN COMPONENT ============
export function TeamsDashboard({ token, org }) {
  const [teams, setTeams] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [activities, setActivities] = useState([])
  const [memberStats, setMemberStats] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [progress, setProgress] = useState(null)
  const [timeFilter, setTimeFilter] = useState('week')
  const [activityTypeFilter, setActivityTypeFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(null)
  
  const toast = useToast()

  // Load teams on mount
  useEffect(() => {
    const loadTeams = async () => {
      if (!token || !org) return
      
      setLoadingTeams(true)
      try {
        const userTeams = await fetchUserTeams(token, org)
        setTeams(userTeams)
        if (userTeams.length > 0) {
          setSelectedTeam(userTeams[0])
        }
      } catch (e) {
        toast.apiError(e.message || 'Failed to load teams')
      } finally {
        setLoadingTeams(false)
      }
    }
    
    loadTeams()
  }, [token, org])

  // Load team members when team is selected
  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedTeam || !token || !org) return
      
      setLoadingMembers(true)
      setMembers([])
      setActivities([])
      setMemberStats([])
      
      try {
        const teamMembers = await fetchTeamMembers(token, org, selectedTeam.slug)
        setMembers(teamMembers)
        toast.info(`Loaded ${teamMembers.length} team members`)
        
        // Now load activities
        setLoadingActivities(true)
        setProgress({ status: 'Loading activities...', percentage: 0 })
        
        const data = await fetchTeamActivities(token, org, teamMembers, setProgress)
        setActivities(data.activities)
        setMemberStats(data.memberStats)
        toast.success(`Loaded ${data.activities.length} team activities`)
      } catch (e) {
        toast.apiError(e.message || 'Failed to load team data')
      } finally {
        setLoadingMembers(false)
        setLoadingActivities(false)
        setProgress(null)
      }
    }
    
    loadMembers()
  }, [selectedTeam, token, org])

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities
    
    // Filter by date from heatmap
    if (selectedDate) {
      filtered = filtered.filter(a => isSameDay(new Date(a.date), selectedDate))
    } else {
      // Filter by time range
      const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
      if (filterDate) {
        filtered = filtered.filter(a => isAfter(new Date(a.date), filterDate))
      }
    }
    
    // Filter by activity type
    if (activityTypeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === activityTypeFilter)
    }
    
    return filtered
  }, [activities, timeFilter, activityTypeFilter, selectedDate])

  if (!token || !org) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium">Missing Configuration</p>
        <p className="text-sm text-red-400/70 mt-1">{!token && 'No token. '}{!org && 'No organization selected.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-electric-400/10 via-purple-500/5 to-neon-pink/10 border border-electric-400/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-electric-400/20 rounded-xl">
            <Users className="w-6 h-6 text-electric-400" />
          </div>
          <div>
            <h2 className="text-frost-100 font-semibold text-lg">Teams Dashboard</h2>
            <p className="text-xs text-frost-300/60">Track all activities across your team members</p>
          </div>
        </div>
        
        <TeamSelector 
          teams={teams} 
          selectedTeam={selectedTeam} 
          onSelect={setSelectedTeam}
          loading={loadingTeams}
        />
      </div>

      {/* Loading State */}
      {(loadingMembers || loadingActivities) && (
        <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 text-electric-400 animate-spin mx-auto mb-4" />
          <p className="text-frost-300/60">{progress?.status || 'Loading team data...'}</p>
          {progress?.percentage > 0 && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="h-2 bg-void-600/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-electric-400 transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-frost-300/40 mt-2">{progress.percentage}%</p>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {selectedTeam && !loadingActivities && activities.length > 0 && (
        <>
          {/* Time Filter & Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-void-700/30 rounded-xl border border-void-600/50">
              {TIME_FILTERS.map(filter => (
                <button
                  key={filter.key}
                  onClick={() => { setTimeFilter(filter.key); setSelectedDate(null) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === filter.key && !selectedDate
                      ? 'bg-electric-400 text-void-900'
                      : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-1 p-1 bg-void-700/30 rounded-xl border border-void-600/50">
              <button
                onClick={() => setActivityTypeFilter('all')}
                className={`px-3 py-2 rounded-lg text-sm transition-all ${activityTypeFilter === 'all' ? 'bg-frost-100 text-void-900' : 'text-frost-300/60 hover:text-frost-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setActivityTypeFilter('commit')}
                className={`p-2 rounded-lg transition-all ${activityTypeFilter === 'commit' ? 'bg-neon-green/20 text-neon-green' : 'text-frost-300/60 hover:text-frost-200'}`}
              >
                <GitCommit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivityTypeFilter('pr')}
                className={`p-2 rounded-lg transition-all ${activityTypeFilter === 'pr' ? 'bg-purple-500/20 text-purple-400' : 'text-frost-300/60 hover:text-frost-200'}`}
              >
                <GitPullRequest className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivityTypeFilter('review')}
                className={`p-2 rounded-lg transition-all ${activityTypeFilter === 'review' ? 'bg-electric-400/20 text-electric-400' : 'text-frost-300/60 hover:text-frost-200'}`}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActivityTypeFilter('comment')}
                className={`p-2 rounded-lg transition-all ${activityTypeFilter === 'comment' ? 'bg-yellow-400/20 text-yellow-400' : 'text-frost-300/60 hover:text-frost-200'}`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            
            {selectedDate && (
              <div className="px-3 py-2 bg-neon-pink/10 border border-neon-pink/30 rounded-lg text-sm text-neon-pink">
                Showing: {format(selectedDate, 'MMMM d, yyyy')}
              </div>
            )}
          </div>
          
          {/* Stats */}
          <TeamStats memberStats={memberStats} timeFilter={timeFilter} activities={activities} />
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-frost-100 font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-electric-400" />
                  Team Activity Feed
                  <span className="text-xs px-2 py-0.5 bg-void-600/50 rounded text-frost-300/60">
                    {filteredActivities.length}
                  </span>
                </h3>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-12 text-frost-300/60">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No activities in this time range</p>
                  </div>
                ) : (
                  filteredActivities.slice(0, 50).map(activity => (
                    <ActivityCard key={activity.id} activity={activity} org={org} />
                  ))
                )}
              </div>
            </div>
            
            {/* Leaderboard */}
            <div className="space-y-4">
              <h3 className="text-frost-100 font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Team Leaderboard
              </h3>
              
              <Leaderboard 
                memberStats={memberStats} 
                timeFilter={timeFilter} 
                activities={activities}
              />
            </div>
          </div>
          
          {/* Heatmap */}
          <TeamHeatmap 
            activities={activities}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </>
      )}
      
      {/* Empty State */}
      {selectedTeam && !loadingActivities && activities.length === 0 && (
        <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-frost-300/30 mx-auto mb-4" />
          <h3 className="text-frost-100 font-medium mb-2">No Activities Found</h3>
          <p className="text-frost-300/60 text-sm">
            This team has no recent activities or the members haven't made any contributions yet.
          </p>
        </div>
      )}
    </div>
  )
}

