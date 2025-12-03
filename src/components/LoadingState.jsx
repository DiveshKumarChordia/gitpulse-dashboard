import { Loader2, GitCommit, GitPullRequest, Zap, CheckCircle } from 'lucide-react'

export function LoadingState({ progress }) {
  const isCached = progress?.cached
  const isComplete = progress?.percentage === 100

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-8">
        {isComplete ? (
          <div className="w-24 h-24 rounded-full bg-neon-green/20 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-neon-green" />
          </div>
        ) : (
          <>
            {/* Animated loading circle */}
            <div className="w-24 h-24 rounded-full border-4 border-void-600/50 border-t-electric-400 animate-spin" />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-electric-400 animate-pulse" />
            </div>
          </>
        )}
      </div>
      
      <h3 className="text-xl font-display font-semibold text-frost-200 mb-2">
        {isCached ? 'Loading from cache...' : isComplete ? 'Done!' : 'Fetching your activity...'}
      </h3>
      
      <p className="text-frost-300/60 max-w-md mb-4">
        {progress?.status || 'Using GitHub Search API for lightning-fast results'}
      </p>
      
      {/* Progress indicator */}
      {progress && !isCached && (
        <div className="w-72 mb-8">
          <div className="h-3 bg-void-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-electric-400 via-neon-pink to-neon-orange rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-frost-300/60">{progress.status}</span>
            <span className="text-xs text-electric-400 font-mono">{progress.percentage}%</span>
          </div>
        </div>
      )}
      
      {/* Speed indicator */}
      {!isComplete && (
        <div className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 rounded-full">
          <Zap className="w-4 h-4 text-neon-green" />
          <span className="text-sm text-neon-green font-medium">
            Using Search API - 10x faster
          </span>
        </div>
      )}
    </div>
  )
}
