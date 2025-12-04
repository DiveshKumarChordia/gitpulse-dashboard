/**
 * Team Members Section Component
 * Shows activities by team members in ORGANIZATION REPOS ONLY
 * With date range filtering
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  Loader2, UserCheck, Activity, Folder, X, ChevronDown, Search,
  Calendar, AlertCircle
} from 'lucide-react'
import { isSameDay, isAfter, isBefore, subMonths, format, startOfDay, endOfDay } from 'date-fns'
import { fetchUserEvents, ACTIVITY_TYPES } from '../../api/github/activities'
import { ActivityFeed } from './ActivityFeed'
import { Leaderboard } from './Leaderboard'
import { Heatmap } from './Heatmap'
import { StatsCards } from './StatsCards'
import { useToast } from '../Toast'

// Activity type filters
const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'commits', label: 'Commits', types: [ACTIVITY_TYPES.COMMIT, ACTIVITY_TYPES.PUSH] },
  { key: 'prs', label: 'PRs', types: [ACTIVITY_TYPES.PR_OPENED, ACTIVITY_TYPES.PR_MERGED, ACTIVITY_TYPES.PR_CLOSED] },
  { key: 'reviews', label: 'Reviews', types: [ACTIVITY_TYPES.REVIEW_APPROVED, ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED, ACTIVITY_TYPES.REVIEW_COMMENTED] },
  { key: 'comments', label: 'Comments', types: [ACTIVITY_TYPES.PR_COMMENT, ACTIVITY_TYPES.ISSUE_COMMENT, ACTIVITY_TYPES.COMMIT_COMMENT] },
]

// Time presets
const TIME_PRESETS = [
  { key: '7d', label: '7 Days', getDates: () => ({ start: subMonths(new Date(), 0.25), end: new Date() }) },
  { key: '30d', label: '30 Days', getDates: () => ({ start: subMonths(new Date(), 1), end: new Date() }) },
  { key: '3m', label: '3 Months', getDates: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
]

// ============ DATE RANGE PICKER ============
function DateRangePicker({ startDate, endDate, onDateChange, maxMonths = 3 }) {
  const [open, setOpen] = useState(false)
  const [tempStart, setTempStart] = useState(startDate ? format(startDate, 'yyyy-MM-dd') : '')
  const [tempEnd, setTempEnd] = useState(endDate ? format(endDate, 'yyyy-MM-dd') : '')
  
  const minDate = format(subMonths(new Date(), maxMonths), 'yyyy-MM-dd')
  const maxDate = format(new Date(), 'yyyy-MM-dd')
  
  const handleApply = () => {
    if (tempStart && tempEnd) {
      onDateChange(new Date(tempStart), new Date(tempEnd))
    }
    setOpen(false)
  }
  
  const handleClear = () => {
    setTempStart('')
    setTempEnd('')
    onDateChange(null, null)
    setOpen(false)
  }
  
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
          startDate && endDate
            ? 'bg-purple-400/10 border-purple-400/30 text-purple-400'
            : 'bg-void-700/50 border-void-600/50 text-frost-300/60 hover:text-frost-200'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">
          {startDate && endDate 
            ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
            : 'Date Range'
          }
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl z-50 overflow-hidden p-4">
          <div className="space-y-4">
            {/* Presets */}
            <div className="flex gap-2">
              {TIME_PRESETS.map(preset => (
                <button
                  key={preset.key}
                  onClick={() => {
                    const { start, end } = preset.getDates()
                    setTempStart(format(start, 'yyyy-MM-dd'))
                    setTempEnd(format(end, 'yyyy-MM-dd'))
                  }}
                  className="px-3 py-1.5 bg-void-700/50 hover:bg-void-700 text-frost-300/60 hover:text-frost-200 rounded-lg text-xs transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {/* Date Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-frost-300/50 block mb-1">From</label>
                <input
                  type="date"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-200 text-sm focus:outline-none focus:border-purple-400/50"
                />
              </div>
              <div>
                <label className="text-xs text-frost-300/50 block mb-1">To</label>
                <input
                  type="date"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-200 text-sm focus:outline-none focus:border-purple-400/50"
                />
              </div>
            </div>
            
            {/* Info */}
            <p className="text-xs text-frost-300/40 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Maximum range: {maxMonths} months
            </p>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={handleClear}
                className="flex-1 py-2 bg-void-700/50 hover:bg-void-700 rounded-lg text-frost-300/60 text-sm transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={handleApply}
                className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ REPO FILTER COMPONENT ============
function RepoFilter({ repos, selectedRepos, onSelectionChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  const filteredRepos = repos.filter(r => 
    r.toLowerCase().includes(search.toLowerCase())
  )
  
  const handleToggle = (repo) => {
    if (selectedRepos.includes(repo)) {
      onSelectionChange(selectedRepos.filter(r => r !== repo))
    } else {
      onSelectionChange([...selectedRepos, repo])
    }
  }
  
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
          selectedRepos.length > 0 
            ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' 
            : 'bg-void-700/50 border-void-600/50 text-frost-300/60 hover:text-frost-200'
        }`}
      >
        <Folder className="w-4 h-4" />
        <span className="text-sm font-medium">
          {selectedRepos.length > 0 ? `${selectedRepos.length} Repos` : 'Filter by Repo'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-void-600/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" />
              <input
                type="text"
                placeholder="Search repos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-200 text-sm placeholder:text-frost-300/40 focus:outline-none focus:border-yellow-400/30"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between px-3 py-2 border-b border-void-600/30 bg-void-700/30">
            <button onClick={() => onSelectionChange(filteredRepos)} className="text-xs text-electric-400 hover:text-electric-500">Select all</button>
            <button onClick={() => onSelectionChange([])} className="text-xs text-frost-300/60 hover:text-frost-200">Clear</button>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredRepos.map(repo => (
              <label key={repo} className="flex items-center gap-3 px-3 py-2 hover:bg-void-700/50 rounded-lg cursor-pointer transition-colors">
                <input type="checkbox" checked={selectedRepos.includes(repo)} onChange={() => handleToggle(repo)} className="accent-yellow-400" />
                <span className="text-sm text-frost-200 truncate">{repo}</span>
              </label>
            ))}
            {filteredRepos.length === 0 && <p className="text-center py-4 text-frost-300/50 text-sm">No repos found</p>}
          </div>
          
          <div className="p-2 border-t border-void-600/30">
            <button onClick={() => setOpen(false)} className="w-full py-2 bg-void-700/50 hover:bg-void-700 rounded-lg text-frost-300/60 text-sm transition-colors">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TeamMembersSection({ token, org, members, repos = [], onMemberClick }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedRepos, setSelectedRepos] = useState([])
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const toast = useToast()
  
  // Get org repo names for filtering
  const orgRepoNames = useMemo(() => {
    return new Set(repos.map(r => r.name))
  }, [repos])
  
  // Get unique org repos from activities
  const availableRepos = useMemo(() => {
    const repoSet = new Set()
    activities.forEach(a => {
      if (a.repo && orgRepoNames.has(a.repo)) {
        repoSet.add(a.repo)
      }
    })
    return Array.from(repoSet).sort()
  }, [activities, orgRepoNames])
  
  useEffect(() => {
    const load = async () => {
      if (!members.length) return
      setLoading(true)
      
      try {
        const allActs = []
        const memberStatsMap = {}
        
        const BATCH_SIZE = 3
        for (let i = 0; i < members.length; i += BATCH_SIZE) {
          const batch = members.slice(i, i + BATCH_SIZE)
          setProgress({
            status: `Loading ${batch.map(m => m.login).join(', ')}...`,
            percentage: Math.round((i / members.length) * 100)
          })
          
          const results = await Promise.all(
            batch.map(async (member) => {
              const memberActivities = await fetchUserEvents(token, member.login)
              return { member, activities: memberActivities }
            })
          )
          
          for (const { member, activities: memberActivities } of results) {
            if (!memberStatsMap[member.login]) {
              memberStatsMap[member.login] = {
                login: member.login,
                avatarUrl: member.avatarUrl,
                commits: 0, prs: 0, merges: 0, reviews: 0, comments: 0,
                reposActive: new Set(),
                total: 0,
              }
            }
            
            // ONLY include activities from ORG REPOS
            for (const act of memberActivities) {
              // Filter: only include if repo belongs to org
              if (act.repo && orgRepoNames.has(act.repo)) {
                allActs.push(act)
                
                const s = memberStatsMap[member.login]
                s.reposActive.add(act.repo)
                
                if (act.type === ACTIVITY_TYPES.COMMIT || act.type === ACTIVITY_TYPES.PUSH) {
                  s.commits += act.commitCount || 1
                } else if (act.type === ACTIVITY_TYPES.PR_OPENED) {
                  s.prs++
                } else if (act.type === ACTIVITY_TYPES.PR_MERGED) {
                  s.merges++
                } else if (act.type?.includes('review')) {
                  s.reviews++
                } else if (act.type?.includes('comment')) {
                  s.comments++
                }
              }
            }
          }
        }
        
        allActs.sort((a, b) => new Date(b.date) - new Date(a.date))
        const seen = new Set()
        const unique = allActs.filter(a => {
          if (seen.has(a.id)) return false
          seen.add(a.id)
          return true
        })
        
        const finalStats = Object.values(memberStatsMap).map(s => ({
          ...s,
          reposActive: s.reposActive.size,
          total: s.commits + s.prs + s.merges + s.reviews + s.comments,
        })).sort((a, b) => b.total - a.total)
        
        setActivities(unique)
        setStats(finalStats)
        toast.success(`Loaded ${unique.length} org activities from ${members.length} members`)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoading(false)
        setProgress(null)
      }
    }
    
    load()
  }, [token, org, members, orgRepoNames])
  
  // Apply all filters
  const filteredActivities = useMemo(() => {
    let filtered = activities
    
    // Repo filter
    if (selectedRepos.length > 0) {
      filtered = filtered.filter(a => selectedRepos.includes(a.repo))
    }
    
    // Single date filter (from heatmap)
    if (selectedDate) {
      filtered = filtered.filter(a => isSameDay(new Date(a.date), selectedDate))
    }
    
    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(a => {
        const d = new Date(a.date)
        return isAfter(d, startOfDay(dateRange.start)) && isBefore(d, endOfDay(dateRange.end))
      })
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      const filter = TYPE_FILTERS.find(f => f.key === typeFilter)
      if (filter?.types) {
        filtered = filtered.filter(a => filter.types.includes(a.type))
      }
    }
    
    return filtered
  }, [activities, selectedDate, typeFilter, selectedRepos, dateRange])
  
  // Recalculate stats for filtered activities
  const filteredStats = useMemo(() => {
    if (selectedRepos.length === 0 && !dateRange.start) return stats
    
    const memberStatsMap = {}
    stats.forEach(s => {
      memberStatsMap[s.login] = { ...s, commits: 0, prs: 0, merges: 0, reviews: 0, comments: 0, reposActive: new Set() }
    })
    
    filteredActivities.forEach(act => {
      if (!memberStatsMap[act.author]) return
      
      const s = memberStatsMap[act.author]
      if (act.repo) s.reposActive.add(act.repo)
      
      if (act.type === ACTIVITY_TYPES.COMMIT || act.type === ACTIVITY_TYPES.PUSH) {
        s.commits += act.commitCount || 1
      } else if (act.type === ACTIVITY_TYPES.PR_OPENED) {
        s.prs++
      } else if (act.type === ACTIVITY_TYPES.PR_MERGED) {
        s.merges++
      } else if (act.type?.includes('review')) {
        s.reviews++
      } else if (act.type?.includes('comment')) {
        s.comments++
      }
    })
    
    return Object.values(memberStatsMap).map(s => ({
      ...s,
      reposActive: s.reposActive.size,
      total: s.commits + s.prs + s.merges + s.reviews + s.comments,
    })).sort((a, b) => b.total - a.total)
  }, [stats, filteredActivities, selectedRepos, dateRange])
  
  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end })
    setSelectedDate(null) // Clear single date selection
  }
  
  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-frost-100 text-lg font-medium mb-2">{progress?.status || 'Loading...'}</p>
        {progress?.percentage > 0 && (
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-void-600/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-fuchsia-400 transition-all duration-300" style={{ width: `${progress.percentage}%` }} />
            </div>
            <p className="text-xs text-frost-300/50 mt-2">{progress.percentage}%</p>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
        <UserCheck className="w-5 h-5 text-purple-400" />
        <span className="text-purple-400 font-medium">Team member activities in organization repos only</span>
        <span className="text-frost-300/50 text-sm">• {activities.length} activities</span>
      </div>
      
      {/* Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Date Range Picker */}
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onDateChange={handleDateRangeChange}
          maxMonths={3}
        />
        
        {/* Repo Filter */}
        <RepoFilter repos={availableRepos} selectedRepos={selectedRepos} onSelectionChange={setSelectedRepos} />
        
        {/* Selected Repos Pills */}
        {selectedRepos.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedRepos.slice(0, 3).map(repo => (
              <span key={repo} className="flex items-center gap-1.5 px-2 py-1 bg-yellow-400/15 text-yellow-400 rounded-lg text-xs">
                {repo}
                <button onClick={() => setSelectedRepos(selectedRepos.filter(r => r !== repo))}><X className="w-3 h-3" /></button>
              </span>
            ))}
            {selectedRepos.length > 3 && <span className="text-xs text-frost-300/50">+{selectedRepos.length - 3} more</span>}
          </div>
        )}
        
        <div className="h-6 w-px bg-void-600/50" />
        
        {/* Type Filters */}
        <div className="flex items-center gap-1 p-1 bg-void-700/30 rounded-xl border border-void-600/50">
          {TYPE_FILTERS.map(t => (
            <button 
              key={t.key} 
              onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t.key ? 'bg-purple-500 text-white' : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-700/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        
        {/* Clear Date Selection */}
        {selectedDate && (
          <button 
            onClick={() => setSelectedDate(null)}
            className="flex items-center gap-1 px-3 py-1.5 bg-electric-400/10 text-electric-400 rounded-lg text-xs"
          >
            {format(selectedDate, 'MMM d')} <X className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {/* Stats */}
      <StatsCards stats={filteredStats} type="member" />
      
      {/* Heatmap */}
      <Heatmap 
        activities={filteredActivities} 
        selectedDate={selectedDate} 
        onDateSelect={setSelectedDate}
        months={3}
      />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ActivityFeed 
            activities={filteredActivities}
            title="Member Activities"
            onMemberClick={onMemberClick}
            maxHeight="800px"
            searchable
          />
        </div>
        
        <Leaderboard 
          stats={filteredStats} 
          activities={filteredActivities} 
          title="Member Rankings"
          onMemberClick={onMemberClick}
          showFilters={false}
        />
      </div>
    </div>
  )
}

export default TeamMembersSection
