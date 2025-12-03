import { Inbox, Filter, RefreshCw } from 'lucide-react'

export function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-void-700/50 rounded-2xl flex items-center justify-center border border-void-600/50">
          {hasFilters ? (
            <Filter className="w-10 h-10 text-frost-300/40" />
          ) : (
            <Inbox className="w-10 h-10 text-frost-300/40" />
          )}
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-electric-400/20 rounded-lg flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-electric-400" />
        </div>
      </div>
      
      <h3 className="text-xl font-display font-semibold text-frost-200 mb-2">
        {hasFilters ? 'No matching activities' : 'No activities yet'}
      </h3>
      
      <p className="text-frost-300/60 max-w-md mb-6">
        {hasFilters 
          ? 'Try adjusting your filters or date range to see more results.'
          : 'Once you start making commits and pull requests, they will appear here.'}
      </p>
      
      {hasFilters && (
        <p className="text-sm text-electric-400">
          Tip: Clear filters from the sidebar to see all activities
        </p>
      )}
    </div>
  )
}

