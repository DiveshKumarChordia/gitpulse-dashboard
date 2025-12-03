import { GitCommit, GitPullRequest, Folder, TrendingUp, Activity, Zap } from 'lucide-react'

export function StatsBar({ stats }) {
  const statCards = [
    { 
      label: 'Commits', 
      value: stats.totalCommits, 
      icon: GitCommit, 
      color: 'neon-green',
      gradient: 'from-neon-green/20 to-neon-green/5',
      borderColor: 'border-neon-green/30',
    },
    { 
      label: 'Pull Requests', 
      value: stats.totalPRs, 
      icon: GitPullRequest, 
      color: 'purple-400',
      gradient: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
    },
    { 
      label: 'Repos Active', 
      value: stats.reposActive, 
      icon: Folder, 
      color: 'electric-400',
      gradient: 'from-electric-400/20 to-electric-400/5',
      borderColor: 'border-electric-400/30',
    },
    { 
      label: 'Total Activities', 
      value: stats.totalCommits + stats.totalPRs, 
      icon: Zap, 
      color: 'yellow-400',
      gradient: 'from-yellow-400/20 to-yellow-400/5',
      borderColor: 'border-yellow-400/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div 
          key={stat.label}
          className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} border ${stat.borderColor} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Background decoration */}
          <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
          
          <div className="relative flex items-center gap-4">
            <div className={`p-3 bg-${stat.color}/15 rounded-xl border ${stat.borderColor} group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}`} />
            </div>
            <div>
              <p className="text-3xl font-bold text-frost-100 tracking-tight">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-frost-300/60 font-medium">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
