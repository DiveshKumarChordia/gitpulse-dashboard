/**
 * Member Profile View Component
 * Shows detailed activity for a single team member
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  ArrowLeft, ExternalLink, Loader2, GitCommit, GitPullRequest, 
  Eye, MessageSquare, Folder, Zap, GitMerge, Rocket
} from 'lucide-react'
import { isAfter } from 'date-fns'
import { fetchUserEvents, calculateStatsFromActivities } from '../../api/github/activities'
import { ActivityCard } from './ActivityCard'
import { Heatmap } from './Heatmap'
import { TIME_FILTERS } from './Leaderboard'

export function MemberProfile({ member, token, org, onBack }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeFilter, setTimeFilter] = useState('month')
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
    
    // Date filter from heatmap
    if (selectedDate) {
      const dateStr = selectedDate.toDateString()
      filtered = filtered.filter(a => new Date(a.date).toDateString() === dateStr)
    }
    
    return filtered
  }, [activities, timeFilter, selectedDate])
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack} 
          className="p-2.5 hover:bg-void-700 rounded-xl transition-colors border border-void-600/50"
        >
          <ArrowLeft className="w-5 h-5 text-frost-300/60" />
        </button>
        
        <img 
          src={member.avatarUrl} 
          alt="" 
          className="w-16 h-16 rounded-full ring-4 ring-purple-500/30" 
        />
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-frost-100">{member.login}</h2>
          <p className="text-frost-300/60">Activity Profile • {org}</p>
        </div>
        
        <a 
          href={member.url || `https://github.com/${member.login}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="px-4 py-2.5 bg-void-700/50 hover:bg-void-700 rounded-xl text-frost-300/60 hover:text-frost-200 transition-all flex items-center gap-2 border border-void-600/50"
        >
          <ExternalLink className="w-4 h-4" /> 
          GitHub Profile
        </a>
      </div>
      
      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-frost-300/60">Loading activity...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">
          <p>Error: {error}</p>
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
                { label: 'Reviews', value: stats.reviews, icon: Eye, color: 'electric-400' },
                { label: 'Comments', value: stats.comments, icon: MessageSquare, color: 'yellow-400' },
                { label: 'Releases', value: stats.releases || 0, icon: Rocket, color: 'pink-400' },
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
          
          {/* Time Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {TIME_FILTERS.slice(0, 5).map(f => (
              <button 
                key={f.key} 
                onClick={() => setTimeFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  timeFilter === f.key 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-void-700/50 text-frost-300/60 hover:text-frost-200 border border-void-600/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          
          {/* Heatmap */}
          <Heatmap 
            activities={activities} 
            selectedDate={selectedDate} 
            onDateSelect={setSelectedDate}
          />
          
          {/* Activity Feed */}
          <div className="space-y-4">
            <h3 className="text-frost-100 font-semibold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-electric-400" />
              Activity Timeline
              <span className="text-sm px-2 py-0.5 bg-void-600/50 rounded-full text-frost-300/60 font-normal">
                {filteredActivities.length} activities
              </span>
            </h3>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredActivities.slice(0, 100).map((a, i) => (
                <ActivityCard key={a.id} activity={a} animate={i < 10} />
              ))}
              
              {filteredActivities.length === 0 && (
                <div className="text-center py-12 text-frost-300/50">
                  No activity in this period
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MemberProfile

