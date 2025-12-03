import { GitCommit, GitPullRequest, Folders, TrendingUp } from 'lucide-react'

export function StatsBar({ stats }) {
  const statItems = [
    {
      label: 'Commits',
      value: stats.totalCommits,
      icon: GitCommit,
      color: 'electric',
      gradient: 'from-electric-400 to-electric-600',
    },
    {
      label: 'Pull Requests',
      value: stats.totalPRs,
      icon: GitPullRequest,
      color: 'neon-pink',
      gradient: 'from-neon-pink to-purple-500',
    },
    {
      label: 'Active Repos',
      value: stats.reposActive,
      icon: Folders,
      color: 'neon-orange',
      gradient: 'from-neon-orange to-yellow-500',
    },
    {
      label: 'Total Activities',
      value: stats.totalCommits + stats.totalPRs,
      icon: TrendingUp,
      color: 'neon-green',
      gradient: 'from-neon-green to-emerald-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((stat, index) => (
        <div
          key={stat.label}
          className="group relative bg-void-700/30 border border-void-600/50 rounded-2xl p-5 hover:border-void-600 transition-all duration-300 animate-fade-in overflow-hidden"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Background glow */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} 
          />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-frost-300/60 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} bg-opacity-20`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-display font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

