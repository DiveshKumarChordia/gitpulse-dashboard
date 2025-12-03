import { Loader2, GitCommit, GitPullRequest, Folders } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-8">
        {/* Animated loading circle */}
        <div className="w-24 h-24 rounded-full border-4 border-void-600/50 border-t-electric-400 animate-spin" />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-electric-400 animate-pulse" />
        </div>
      </div>
      
      <h3 className="text-xl font-display font-semibold text-frost-200 mb-2">
        Loading your activity...
      </h3>
      
      <p className="text-frost-300/60 max-w-md mb-8">
        Fetching commits and pull requests from your repositories
      </p>
      
      {/* Animated loading items */}
      <div className="flex gap-4">
        {[
          { icon: GitCommit, label: 'Commits', delay: '0ms' },
          { icon: GitPullRequest, label: 'PRs', delay: '200ms' },
          { icon: Folders, label: 'Repos', delay: '400ms' },
        ].map(({ icon: Icon, label, delay }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 p-4 bg-void-700/30 rounded-xl border border-void-600/50 animate-pulse"
            style={{ animationDelay: delay }}
          >
            <Icon className="w-5 h-5 text-electric-400/50" />
            <span className="text-xs text-frost-300/40">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

