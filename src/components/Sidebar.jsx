import { useState, useMemo } from 'react'
import { Search, Calendar, Filter, RefreshCw, GitCommit, GitPullRequest, Layers, ChevronDown, ChevronUp } from 'lucide-react'

export function Sidebar({
  isOpen,
  repos,
  allRepos,
  selectedRepos,
  onRepoChange,
  dateRange,
  onDateRangeChange,
  activityType,
  onActivityTypeChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  loading,
  progress,
}) {
  const [repoSearchQuery, setRepoSearchQuery] = useState('')
  const [showAllRepos, setShowAllRepos] = useState(false)

  // Filter repos based on search
  const filteredRepos = useMemo(() => {
    const repoList = showAllRepos ? allRepos : repos
    if (!repoSearchQuery.trim()) return repoList
    const query = repoSearchQuery.toLowerCase()
    return repoList.filter(repo => {
      const name = typeof repo === 'string' ? repo : repo.name
      return name.toLowerCase().includes(query)
    })
  }, [repos, allRepos, repoSearchQuery, showAllRepos])

  const handleRepoToggle = (repoName) => {
    if (selectedRepos.includes(repoName)) {
      onRepoChange(selectedRepos.filter(r => r !== repoName))
    } else {
      onRepoChange([...selectedRepos, repoName])
    }
  }

  const handleSelectAll = () => {
    const repoNames = filteredRepos.map(r => typeof r === 'string' ? r : r.name)
    if (selectedRepos.length === repoNames.length && repoNames.every(r => selectedRepos.includes(r))) {
      onRepoChange([])
    } else {
      onRepoChange([...new Set([...selectedRepos, ...repoNames])])
    }
  }

  const clearFilters = () => {
    onRepoChange([])
    onDateRangeChange({ from: '', to: '' })
    onActivityTypeChange('all')
    onSearchChange('')
  }

  const hasActiveFilters = selectedRepos.length > 0 || dateRange.from || dateRange.to || activityType !== 'all' || searchQuery
  
  const displayRepos = showAllRepos ? allRepos : repos

  return (
    <aside 
      className={`fixed left-0 top-[73px] bottom-0 w-80 bg-void-800/50 backdrop-blur-xl border-r border-void-600/50 overflow-y-auto transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-frost-200">
            <Search className="w-4 h-4 text-electric-400" />
            Search Activities
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search commits, PRs, repos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 focus:ring-1 focus:ring-electric-400/25 transition-all text-sm"
            />
          </div>
        </div>

        {/* Activity Type Filter */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-frost-200">
            <Filter className="w-4 h-4 text-electric-400" />
            Activity Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'all', label: 'All', icon: Layers },
              { value: 'commit', label: 'Commits', icon: GitCommit },
              { value: 'pr', label: 'PRs', icon: GitPullRequest },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onActivityTypeChange(value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  activityType === value
                    ? 'bg-electric-400/10 border-electric-400/50 text-electric-400'
                    : 'bg-void-700/30 border-void-600/50 text-frost-300/60 hover:bg-void-700/50 hover:text-frost-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-frost-200">
            <Calendar className="w-4 h-4 text-electric-400" />
            Date Range
          </label>
          <div className="space-y-2">
            <div className="space-y-1">
              <span className="text-xs text-frost-300/60">From</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 focus:outline-none focus:border-electric-400/50 transition-all text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-frost-300/60">To</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 focus:outline-none focus:border-electric-400/50 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Repository Filter */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-frost-200">
              <Layers className="w-4 h-4 text-electric-400" />
              Repositories
              {selectedRepos.length > 0 && (
                <span className="px-1.5 py-0.5 bg-electric-400/20 text-electric-400 rounded text-xs">
                  {selectedRepos.length}
                </span>
              )}
            </label>
          </div>

          {/* Toggle between active repos and all repos */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAllRepos(false)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !showAllRepos 
                  ? 'bg-electric-400/20 text-electric-400 border border-electric-400/30' 
                  : 'bg-void-700/30 text-frost-300/60 border border-void-600/50 hover:bg-void-700/50'
              }`}
            >
              With Activity ({repos.length})
            </button>
            <button
              onClick={() => setShowAllRepos(true)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showAllRepos 
                  ? 'bg-electric-400/20 text-electric-400 border border-electric-400/30' 
                  : 'bg-void-700/30 text-frost-300/60 border border-void-600/50 hover:bg-void-700/50'
              }`}
            >
              All Repos ({allRepos.length})
            </button>
          </div>

          {/* Repo search */}
          <input
            type="text"
            placeholder="Search repositories..."
            value={repoSearchQuery}
            onChange={(e) => setRepoSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 transition-all text-xs"
          />

          {/* Select all / clear */}
          {filteredRepos.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-xs text-electric-400 hover:text-electric-500 transition-colors"
            >
              {selectedRepos.length === filteredRepos.length ? 'Clear selection' : 'Select all visible'}
            </button>
          )}
          
          <div className="max-h-48 overflow-y-auto space-y-1 pr-2">
            {filteredRepos.length === 0 ? (
              <p className="text-sm text-frost-300/40 italic">
                {repoSearchQuery ? 'No matching repositories' : 'No repositories found'}
              </p>
            ) : (
              filteredRepos.map((repo) => {
                const repoName = typeof repo === 'string' ? repo : repo.name
                const repoDesc = typeof repo === 'object' ? repo.description : null
                return (
                  <label
                    key={repoName}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-void-700/30 cursor-pointer transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRepos.includes(repoName)}
                      onChange={() => handleRepoToggle(repoName)}
                      className="flex-shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                      <span className="text-sm text-frost-200 group-hover:text-frost-100 transition-colors block truncate">
                        {repoName}
                      </span>
                      {repoDesc && (
                        <span className="text-xs text-frost-300/40 block truncate">
                          {repoDesc}
                        </span>
                      )}
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-void-600/50 space-y-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2.5 bg-void-700/50 hover:bg-void-700 border border-void-600/50 rounded-xl text-frost-300 text-sm font-medium transition-all"
            >
              Clear All Filters
            </button>
          )}
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full flex flex-col items-center justify-center gap-1 px-4 py-2.5 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-blue"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Fetching...' : 'Refresh Data'}
            </div>
            {loading && progress && (
              <span className="text-xs opacity-80">
                {progress.processed}/{progress.total} repos ({progress.percentage}%)
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
