/**
 * Advanced Leaderboard Component
 * Shows rankings with multiple metrics and time filters
 */

import { useMemo, useState } from 'react'
import { 
  Trophy, Crown, Medal, Award, GitCommit, GitPullRequest, Eye,
  MessageSquare, CheckCircle, Code, Folder, Activity, GitMerge,
  Tag, Rocket, AlertTriangle
} from 'lucide-react'
import { isAfter, subDays, subMonths, startOfDay } from 'date-fns'

// ============ METRICS CONFIGURATION ============
export const LEADERBOARD_METRICS = [
  { key: 'total', label: 'Total', icon: Activity, description: 'All activity combined' },
  { key: 'commits', label: 'Commits', icon: GitCommit, description: 'Code commits' },
  { key: 'prs', label: 'PRs', icon: GitPullRequest, description: 'Pull requests opened' },
  { key: 'merges', label: 'Merges', icon: GitMerge, description: 'PRs merged' },
  { key: 'reviews', label: 'Reviews', icon: Eye, description: 'Code reviews given' },
  { key: 'approvals', label: 'Approvals', icon: CheckCircle, description: 'PRs approved' },
  { key: 'comments', label: 'Comments', icon: MessageSquare, description: 'Comments made' },
  { key: 'linesAdded', label: 'Lines+', icon: Code, description: 'Lines of code added' },
  { key: 'releases', label: 'Releases', icon: Rocket, description: 'Releases published' },
  { key: 'reposActive', label: 'Repos', icon: Folder, description: 'Repositories active in' },
]

// ============ TIME FILTERS ============
export const TIME_FILTERS = [
  { key: 'today', label: 'Today', getDate: () => startOfDay(new Date()) },
  { key: 'week', label: '7 Days', getDate: () => subDays(new Date(), 7) },
  { key: 'month', label: '30 Days', getDate: () => subMonths(new Date(), 1) },
  { key: '3months', label: '3 Months', getDate: () => subMonths(new Date(), 3) },
  { key: '6months', label: '6 Months', getDate: () => subMonths(new Date(), 6) },
  { key: 'year', label: 'Year', getDate: () => new Date(new Date().getFullYear(), 0, 1) },
  { key: 'all', label: 'All Time', getDate: () => null },
]

// ============ RANK STYLING ============
function getRankStyle(index) {
  if (index === 0) return {
    icon: Crown,
    color: 'text-yellow-400',
    ring: 'ring-yellow-400/50',
    bg: 'from-yellow-400/15 to-orange-400/10 border-yellow-500/30',
  }
  if (index === 1) return {
    icon: Medal,
    color: 'text-gray-300',
    ring: 'ring-gray-400/50',
    bg: 'from-gray-400/15 to-gray-500/10 border-gray-500/30',
  }
  if (index === 2) return {
    icon: Award,
    color: 'text-orange-400',
    ring: 'ring-orange-400/50',
    bg: 'from-orange-400/15 to-red-400/10 border-orange-500/30',
  }
  return {
    icon: null,
    color: 'text-frost-300/60',
    ring: 'ring-void-600',
    bg: 'from-transparent to-transparent border-void-600/50',
  }
}

export function Leaderboard({ 
  stats, 
  activities, 
  title = 'Leaderboard',
  showFilters = true,
  maxItems = 15,
  onMemberClick,
}) {
  const [metric, setMetric] = useState('total')
  const [timeFilter, setTimeFilter] = useState('month')
  
  // Recalculate stats based on time filter
  const filteredStats = useMemo(() => {
    if (!activities || !stats) return stats || []
    
    const filterDate = TIME_FILTERS.find(f => f.key === timeFilter)?.getDate()
    if (!filterDate) return stats
    
    // Recalculate from activities
    const recalc = {}
    stats.forEach(s => {
      recalc[s.login] = {
        ...s,
        commits: 0,
        prs: 0,
        merges: 0,
        reviews: 0,
        approvals: 0,
        comments: 0,
        branches: 0,
        tags: 0,
        releases: 0,
        linesAdded: 0,
        reposActive: new Set(),
      }
    })
    
    activities.forEach(a => {
      if (!isAfter(new Date(a.date), filterDate)) return
      if (!recalc[a.author]) return
      
      const s = recalc[a.author]
      if (a.repo) s.reposActive.add(a.repo)
      
      // Map activity types to stats
      const type = a.type
      if (type === 'commit' || type === 'push') {
        s.commits += a.commitCount || 1
        s.linesAdded += a.additions || a.stats?.additions || 0
      }
      else if (type === 'pr_opened') s.prs++
      else if (type === 'pr_merged') s.merges++
      else if (type === 'review_approved') { s.reviews++; s.approvals++ }
      else if (type?.startsWith('review_')) s.reviews++
      else if (type?.includes('comment')) s.comments++
      else if (type === 'release_published') s.releases++
      else if (type === 'branch_created') s.branches++
      else if (type === 'tag_created') s.tags++
    })
    
    return Object.values(recalc).map(s => ({
      ...s,
      reposActive: typeof s.reposActive === 'object' ? s.reposActive.size : s.reposActive,
      total: s.commits + s.prs + s.merges + s.reviews + s.comments,
    }))
  }, [stats, activities, timeFilter])
  
  // Sort by selected metric
  const sorted = useMemo(() => {
    return [...filteredStats]
      .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
      .slice(0, maxItems)
  }, [filteredStats, metric, maxItems])
  
  const currentMetric = LEADERBOARD_METRICS.find(m => m.key === metric)
  const MetricIcon = currentMetric?.icon || Activity
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-void-600/50">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <h3 className="text-frost-100 font-bold text-lg">{title}</h3>
        </div>
        
        {showFilters && (
          <>
            {/* Metric Selector */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {LEADERBOARD_METRICS.map(m => (
                <button 
                  key={m.key} 
                  onClick={() => setMetric(m.key)}
                  title={m.description}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    metric === m.key 
                      ? 'bg-electric-400 text-void-900 font-semibold shadow-lg shadow-electric-400/25' 
                      : 'bg-void-700/50 text-frost-300/60 hover:text-frost-200 hover:bg-void-700'
                  }`}
                >
                  <m.icon className="w-3 h-3" />
                  {m.label}
                </button>
              ))}
            </div>
            
            {/* Time Filter */}
            <div className="flex flex-wrap gap-1">
              {TIME_FILTERS.map(f => (
                <button 
                  key={f.key} 
                  onClick={() => setTimeFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                    timeFilter === f.key 
                      ? 'bg-purple-500/20 text-purple-400 font-medium' 
                      : 'text-frost-300/50 hover:text-frost-300 hover:bg-void-700/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Rankings */}
      <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
        {sorted.map((s, i) => {
          const rank = getRankStyle(i)
          const RankIcon = rank.icon
          const value = s[metric] || 0
          
          return (
            <div 
              key={s.login}
              onClick={() => onMemberClick?.(s.login)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all bg-gradient-to-r ${rank.bg} hover:scale-[1.01] hover:shadow-lg`}
            >
              {/* Rank */}
              <div className="w-8 flex justify-center flex-shrink-0">
                {RankIcon ? (
                  <RankIcon className={`w-6 h-6 ${rank.color}`} />
                ) : (
                  <span className="text-sm font-mono text-frost-300/40">#{i + 1}</span>
                )}
              </div>
              
              {/* Avatar */}
              <img 
                src={s.avatarUrl} 
                alt="" 
                className={`w-10 h-10 rounded-full ring-2 ${rank.ring} flex-shrink-0`} 
              />
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-frost-100 truncate">{s.login}</span>
                  {s.isInactive && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>
                
                {/* Mini Stats */}
                <div className="flex items-center gap-3 text-xs mt-1">
                  <span className="text-neon-green flex items-center gap-1">
                    <GitCommit className="w-3 h-3" />{s.commits}
                  </span>
                  <span className="text-purple-400 flex items-center gap-1">
                    <GitPullRequest className="w-3 h-3" />{s.prs}
                  </span>
                  <span className="text-fuchsia-400 flex items-center gap-1">
                    <GitMerge className="w-3 h-3" />{s.merges || 0}
                  </span>
                  <span className="text-electric-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" />{s.reviews}
                  </span>
                  <span className="text-yellow-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />{s.comments}
                  </span>
                </div>
              </div>
              
              {/* Score */}
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1.5 justify-end">
                  <MetricIcon className="w-4 h-4 text-frost-300/40" />
                  <span className="text-2xl font-bold text-frost-100">{value.toLocaleString()}</span>
                </div>
                <p className="text-xs text-frost-300/50">{s.reposActive} repos</p>
              </div>
            </div>
          )
        })}
        
        {sorted.length === 0 && (
          <div className="text-center py-12 text-frost-300/50">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No data available for this period</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard

