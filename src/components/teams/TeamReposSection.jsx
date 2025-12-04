/**
 * Team Repos Section Component
 * Shows all activities in team's repositories - LAST 24 HOURS
 * With repo filtering support
 */

import { useState, useEffect, useMemo } from 'react'
import { Loader2, Activity, Clock, Folder, X, ChevronDown, Search } from 'lucide-react'
import { isSameDay } from 'date-fns'
import { fetchTeamRepoActivitiesLast24Hours, calculateStatsFromActivities, ACTIVITY_TYPES } from '../../api/github/activities'
import { ActivityCard } from './ActivityCard'
import { Leaderboard } from './Leaderboard'
import { Heatmap } from './Heatmap'
import { StatsCards } from './StatsCards'
import { useToast } from '../Toast'

// Activity type filter options
const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'commits', label: 'Commits', types: [ACTIVITY_TYPES.COMMIT, ACTIVITY_TYPES.PUSH] },
  { key: 'prs', label: 'PRs', types: [ACTIVITY_TYPES.PR_OPENED, ACTIVITY_TYPES.PR_MERGED, ACTIVITY_TYPES.PR_CLOSED, ACTIVITY_TYPES.PR_REOPENED] },
  { key: 'reviews', label: 'Reviews', types: [ACTIVITY_TYPES.REVIEW_APPROVED, ACTIVITY_TYPES.REVIEW_CHANGES_REQUESTED, ACTIVITY_TYPES.REVIEW_COMMENTED] },
  { key: 'comments', label: 'Comments', types: [ACTIVITY_TYPES.PR_COMMENT, ACTIVITY_TYPES.ISSUE_COMMENT, ACTIVITY_TYPES.COMMIT_COMMENT, ACTIVITY_TYPES.REVIEW_COMMENT] },
  { key: 'branches', label: 'Branches', types: [ACTIVITY_TYPES.BRANCH_CREATED, ACTIVITY_TYPES.BRANCH_DELETED] },
  { key: 'releases', label: 'Releases', types: [ACTIVITY_TYPES.RELEASE_PUBLISHED, ACTIVITY_TYPES.TAG_CREATED] },
]

// ============ REPO FILTER COMPONENT ============
function RepoFilter({ repos, selectedRepos, onSelectionChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  const repoNames = repos.map(r => r.name)
  const filteredRepos = repoNames.filter(r => 
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
          {selectedRepos.length > 0 ? `${selectedRepos.length} Repos Selected` : 'All Repos'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search */}
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
          
          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-void-600/30 bg-void-700/30">
            <button 
              onClick={() => onSelectionChange([])}
              className="text-xs text-electric-400 hover:text-electric-500"
            >
              Show All (clear filter)
            </button>
            <button 
              onClick={() => onSelectionChange(filteredRepos)}
              className="text-xs text-frost-300/60 hover:text-frost-200"
            >
              Select all visible
            </button>
          </div>
          
          {/* Repo List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredRepos.map(repo => (
              <label 
                key={repo}
                className="flex items-center gap-3 px-3 py-2 hover:bg-void-700/50 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedRepos.includes(repo)}
                  onChange={() => handleToggle(repo)}
                  className="accent-yellow-400"
                />
                <span className="text-sm text-frost-200 truncate">{repo}</span>
              </label>
            ))}
            {filteredRepos.length === 0 && (
              <p className="text-center py-4 text-frost-300/50 text-sm">No repos found</p>
            )}
          </div>
          
          {/* Close */}
          <div className="p-2 border-t border-void-600/30">
            <button 
              onClick={() => setOpen(false)}
              className="w-full py-2 bg-void-700/50 hover:bg-void-700 rounded-lg text-frost-300/60 text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TeamReposSection({ token, org, repos, onMemberClick }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedRepos, setSelectedRepos] = useState([])
  const toast = useToast()
  
  // Load activities from last 24 hours
  useEffect(() => {
    const load = async () => {
      if (!repos.length) return
      setLoading(true)
      
      try {
        const allActivities = await fetchTeamRepoActivitiesLast24Hours(token, org, repos, setProgress)
        setActivities(allActivities)
        setStats(calculateStatsFromActivities(allActivities))
        toast.success(`Loaded ${allActivities.length} activities from last 24 hours`)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoading(false)
        setProgress(null)
      }
    }
    
    load()
  }, [token, org, repos])
  
  // Apply filters
  const filteredActivities = useMemo(() => {
    let filtered = activities
    
    // Repo filter
    if (selectedRepos.length > 0) {
      filtered = filtered.filter(a => selectedRepos.includes(a.repo))
    }
    
    // Date filter from heatmap
    if (selectedDate) {
      filtered = filtered.filter(a => isSameDay(new Date(a.date), selectedDate))
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      const filter = TYPE_FILTERS.find(f => f.key === typeFilter)
      if (filter?.types) {
        filtered = filtered.filter(a => filter.types.includes(a.type))
      }
    }
    
    return filtered
  }, [activities, selectedDate, typeFilter, selectedRepos])
  
  // Recalculate stats for filtered activities
  const filteredStats = useMemo(() => {
    if (selectedRepos.length === 0) return stats
    return calculateStatsFromActivities(filteredActivities)
  }, [stats, filteredActivities, selectedRepos])
  
  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-4" />
        <p className="text-frost-100 text-lg font-medium mb-2">{progress?.status || 'Loading...'}</p>
        {progress?.percentage > 0 && (
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-void-600/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-300" 
                style={{ width: `${progress.percentage}%` }} 
              />
            </div>
            <p className="text-xs text-frost-300/50 mt-2">{progress.percentage}%</p>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header with 24h indicator */}
      <div className="flex items-center gap-3 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-xl">
        <Clock className="w-5 h-5 text-yellow-400" />
        <span className="text-yellow-400 font-medium">Showing activities from the last 24 hours</span>
        <span className="text-frost-300/50 text-sm">• {activities.length} total activities</span>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Repo Filter */}
        <RepoFilter 
          repos={repos}
          selectedRepos={selectedRepos}
          onSelectionChange={setSelectedRepos}
        />
        
        {/* Selected Repos Pills */}
        {selectedRepos.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedRepos.slice(0, 3).map(repo => (
              <span 
                key={repo}
                className="flex items-center gap-1.5 px-2 py-1 bg-yellow-400/15 text-yellow-400 rounded-lg text-xs"
              >
                {repo}
                <button onClick={() => setSelectedRepos(selectedRepos.filter(r => r !== repo))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {selectedRepos.length > 3 && (
              <span className="text-xs text-frost-300/50">+{selectedRepos.length - 3} more</span>
            )}
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
                typeFilter === t.key 
                  ? 'bg-yellow-400 text-void-900' 
                  : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-700/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats Summary */}
      <StatsCards stats={filteredStats} type="repo" />
      
      {/* Heatmap */}
      <Heatmap 
        activities={filteredActivities} 
        selectedDate={selectedDate} 
        onDateSelect={setSelectedDate}
        months={1}
      />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-frost-100 font-bold text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-400" />
            Activity Feed
            <span className="text-sm px-3 py-1 bg-void-600/50 rounded-full text-frost-300/60 font-normal">
              {filteredActivities.length} activities
            </span>
          </h3>
          
          <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
            {filteredActivities.slice(0, 150).map((a, i) => (
              <ActivityCard 
                key={a.id} 
                activity={a} 
                onMemberClick={onMemberClick} 
                animate={i < 5} 
              />
            ))}
            
            {filteredActivities.length === 0 && (
              <div className="text-center py-16 text-frost-300/50">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No activities in the last 24 hours</p>
                <p className="text-sm mt-1">Check back later for new updates</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Leaderboard */}
        <Leaderboard 
          stats={filteredStats} 
          activities={filteredActivities} 
          title="Top Contributors (24h)"
          onMemberClick={onMemberClick}
          showFilters={false}
        />
      </div>
    </div>
  )
}

export default TeamReposSection
