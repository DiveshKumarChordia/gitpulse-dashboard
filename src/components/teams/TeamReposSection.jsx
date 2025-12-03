/**
 * Team Repos Section Component
 * Shows all activities in team's repositories - LAST 24 HOURS
 */

import { useState, useEffect, useMemo } from 'react'
import { Loader2, Activity, Clock } from 'lucide-react'
import { isSameDay, isAfter, subHours } from 'date-fns'
import { fetchTeamRepoActivitiesLast24Hours, calculateStatsFromActivities, ACTIVITY_TYPES } from '../../api/github/activities'
import { ActivityCard } from './ActivityCard'
import { Leaderboard } from './Leaderboard'
import { Heatmap } from './Heatmap'
import { StatsCards } from './StatsCards'
import { RepoSelector } from './RepoSelector'
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

export function TeamReposSection({ token, org, repos, onMemberClick }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
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
  }, [activities, selectedDate, typeFilter])
  
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
      <div className="flex items-center gap-4 flex-wrap">
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
      <StatsCards stats={stats} type="repo" />
      
      {/* Heatmap - just for today */}
      <Heatmap 
        activities={activities} 
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
          stats={stats} 
          activities={activities} 
          title="Top Contributors (24h)"
          onMemberClick={onMemberClick}
          showFilters={false}
        />
      </div>
    </div>
  )
}

export default TeamReposSection
