/**
 * Team Members Section Component
 * Shows all activities by team members (anywhere in org)
 * With repo filtering support
 */

import { useState, useEffect, useMemo } from 'react'
import { Loader2, UserCheck, Activity, Folder, X, ChevronDown, Search } from 'lucide-react'
import { isSameDay } from 'date-fns'
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
              onClick={() => onSelectionChange(filteredRepos)}
              className="text-xs text-electric-400 hover:text-electric-500"
            >
              Select all
            </button>
            <button 
              onClick={() => onSelectionChange([])}
              className="text-xs text-frost-300/60 hover:text-frost-200"
            >
              Clear
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

export function TeamMembersSection({ token, org, members, repos = [], onMemberClick }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedRepos, setSelectedRepos] = useState([])
  const toast = useToast()
  
  // Get unique repos from activities
  const availableRepos = useMemo(() => {
    const repoSet = new Set()
    activities.forEach(a => {
      if (a.repo) repoSet.add(a.repo)
    })
    return Array.from(repoSet).sort()
  }, [activities])
  
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
  
  // Apply filters including repo filter
  const filteredActivities = useMemo(() => {
    let filtered = activities
    
    // Repo filter
    if (selectedRepos.length > 0) {
      filtered = filtered.filter(a => selectedRepos.includes(a.repo))
    }
    
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
  }, [activities, selectedDate, typeFilter, selectedRepos])
  
  // Recalculate stats for filtered activities
  const filteredStats = useMemo(() => {
    if (selectedRepos.length === 0) return stats
    
    // Recalculate stats based on filtered repos
    const memberStatsMap = {}
    stats.forEach(s => {
      memberStatsMap[s.login] = {
        ...s,
        commits: 0,
        prs: 0,
        merges: 0,
        reviews: 0,
        comments: 0,
        reposActive: new Set(),
      }
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
  }, [stats, filteredActivities, selectedRepos])
  
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
      
      {/* Filters Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Repo Filter */}
        <RepoFilter 
          repos={availableRepos}
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
        {/* Activity Feed */}
        <div className="xl:col-span-2">
          <ActivityFeed 
            activities={filteredActivities}
            title="Member Activities"
            onMemberClick={onMemberClick}
            maxHeight="800px"
            searchable
          />
        </div>
        
        {/* Leaderboard */}
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
