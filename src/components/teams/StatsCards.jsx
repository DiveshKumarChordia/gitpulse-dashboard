/**
 * Stats Cards Component
 * Displays summary statistics in a grid
 */

import { 
  GitCommit, GitPullRequest, GitMerge, Eye, MessageSquare,
  CheckCircle, Rocket, Users, Tag, Folder
} from 'lucide-react'

export function StatsCards({ stats, type = 'repo' }) {
  // Aggregate stats if array
  const aggregated = Array.isArray(stats) 
    ? stats.reduce((acc, s) => ({
        commits: acc.commits + (s.commits || 0),
        prs: acc.prs + (s.prs || 0),
        merges: acc.merges + (s.merges || 0),
        reviews: acc.reviews + (s.reviews || 0),
        approvals: acc.approvals + (s.approvals || 0),
        comments: acc.comments + (s.comments || 0),
        releases: acc.releases + (s.releases || 0),
        tags: acc.tags + (s.tags || 0),
        contributors: stats.length,
      }), { commits: 0, prs: 0, merges: 0, reviews: 0, approvals: 0, comments: 0, releases: 0, tags: 0, contributors: 0 })
    : stats
  
  const cards = [
    { label: 'Commits', value: aggregated.commits, icon: GitCommit, color: 'neon-green' },
    { label: 'PRs Opened', value: aggregated.prs, icon: GitPullRequest, color: 'purple-400' },
    { label: 'PRs Merged', value: aggregated.merges, icon: GitMerge, color: 'fuchsia-400' },
    { label: 'Reviews', value: aggregated.reviews, icon: Eye, color: 'electric-400' },
    { label: 'Approvals', value: aggregated.approvals, icon: CheckCircle, color: 'green-400' },
    { label: 'Comments', value: aggregated.comments, icon: MessageSquare, color: 'yellow-400' },
    { label: 'Releases', value: aggregated.releases, icon: Rocket, color: 'pink-400' },
    { label: type === 'repo' ? 'Contributors' : 'Members', value: aggregated.contributors || 0, icon: Users, color: 'frost-100' },
  ].filter(c => c.value !== undefined)
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map(card => (
        <div 
          key={card.label} 
          className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 text-center hover:border-void-500/50 transition-all group"
        >
          <card.icon className={`w-5 h-5 text-${card.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
          <p className="text-2xl font-bold text-frost-100">{(card.value || 0).toLocaleString()}</p>
          <p className="text-xs text-frost-300/50">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

export default StatsCards

