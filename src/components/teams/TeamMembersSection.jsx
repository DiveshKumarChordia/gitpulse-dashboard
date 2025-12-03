/**
 * Team Members Section Component
 * Shows all activities by team members (anywhere in org)
 */

import { useState, useEffect, useMemo } from 'react'
import { Loader2, UserCheck, Activity, Clock } from 'lucide-react'
import { isSameDay, subHours } from 'date-fns'
import { fetchUserEvents, calculateStatsFromActivities, ACTIVITY_TYPES } from '../../api/github/activities'
import { ActivityCard } from './ActivityCard'
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

export function TeamMembersSection({ token, org, members, onMemberClick }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const toast = useToast()
  
  useEffect(() => {
    const load = async () => {
      if (!members.length) return
      setLoading(true)
      
      try {
        const allActs = []
        const memberStatsMap = {}
        
        // Process in parallel batches
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
            // Initialize stats for this member
            if (!memberStatsMap[member.login]) {
              memberStatsMap[member.login] = {
                login: member.login,
                avatarUrl: member.avatarUrl,
                commits: 0,
                prs: 0,
                merges: 0,
                reviews: 0,
                comments: 0,
                reposActive: new Set(),
                total: 0,
              }
            }
            
            // Count activities
            for (const act of memberActivities) {
              allActs.push(act)
              
              const s = memberStatsMap[member.login]
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
            }
          }
        }
        
        // Sort and dedupe
        allActs.sort((a, b) => new Date(b.date) - new Date(a.date))
        const seen = new Set()
        const unique = allActs.filter(a => {
          if (seen.has(a.id)) return false
          seen.add(a.id)
          return true
        })
        
        // Finalize stats
        const finalStats = Object.values(memberStatsMap).map(s => ({
          ...s,
          reposActive: s.reposActive.size,
          total: s.commits + s.prs + s.merges + s.reviews + s.comments,
        })).sort((a, b) => b.total - a.total)
        
        setActivities(unique)
        setStats(finalStats)
        toast.success(`Loaded ${unique.length} activities from ${members.length} members`)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoading(false)
        setProgress(null)
      }
    }
    
    load()
  }, [token, org, members])
  
  // Apply filters
  const filteredActivities = useMemo(() => {
    let filtered = activities
    
    // Date filter
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
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-frost-100 text-lg font-medium mb-2">{progress?.status || 'Loading...'}</p>
        {progress?.percentage > 0 && (
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-void-600/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-fuchsia-400 transition-all duration-300" 
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
      {/* Info Header */}
      <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
        <UserCheck className="w-5 h-5 text-purple-400" />
        <span className="text-purple-400 font-medium">Showing recent activities from all team members</span>
        <span className="text-frost-300/50 text-sm">• {activities.length} total activities</span>
      </div>
      
      {/* Type Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-frost-300/60 text-sm">Filter:</span>
        <div className="flex items-center gap-1 p-1 bg-void-700/30 rounded-xl border border-void-600/50">
          {TYPE_FILTERS.map(t => (
            <button 
              key={t.key} 
              onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t.key 
                  ? 'bg-purple-500 text-white' 
                  : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-700/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats */}
      <StatsCards stats={stats} type="member" />
      
      {/* Heatmap */}
      <Heatmap 
        activities={activities} 
        selectedDate={selectedDate} 
        onDateSelect={setSelectedDate}
        months={2}
      />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-frost-100 font-bold text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Member Activities
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
                <p className="text-lg">No activities found</p>
                <p className="text-sm mt-1">Try changing the filters</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Leaderboard */}
        <Leaderboard 
          stats={stats} 
          activities={activities} 
          title="Member Rankings"
          onMemberClick={onMemberClick}
          showFilters={false}
        />
      </div>
    </div>
  )
}

export default TeamMembersSection
