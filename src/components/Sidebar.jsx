import { useState, useMemo } from 'react'
import { 
  Search, Calendar, Filter, RefreshCw, GitCommit, GitPullRequest, Layers, 
  Trash2, MessageSquare, Eye, GitMerge, Tag, Rocket, GitBranch, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { clearCache } from '../api/github'

// ============ COMPREHENSIVE ACTIVITY TYPE FILTERS ============
const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activities', icon: Layers, color: 'electric-400' },
  { value: 'commit', label: 'Commits', icon: GitCommit, color: 'neon-green' },
  { value: 'pr', label: 'Pull Requests', icon: GitPullRequest, color: 'purple-400' },
  { value: 'review', label: 'Reviews', icon: Eye, color: 'cyan-400' },
  { value: 'comment', label: 'Comments', icon: MessageSquare, color: 'yellow-400' },
  { value: 'merge', label: 'Merges', icon: GitMerge, color: 'fuchsia-400' },
  { value: 'branch', label: 'Branches', icon: GitBranch, color: 'teal-400' },
  { value: 'tag', label: 'Tags', icon: Tag, color: 'blue-400' },
  { value: 'release', label: 'Releases', icon: Rocket, color: 'pink-400' },
]

// Time presets
const TIME_PRESETS = [
  { label: 'Today', days: 0 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
]

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
  const [filterExpanded, setFilterExpanded] = useState(true)

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

  const handleTimePreset = (days) => {
    if (days === 0) {
      const today = new Date().toISOString().split('T')[0]
      onDateRangeChange({ from: today, to: today })
    } else {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - days)
      onDateRangeChange({ 
        from: from.toISOString().split('T')[0], 
        to: to.toISOString().split('T')[0] 
      })
    }
  }

  const clearFilters = () => {
    onRepoChange([])
    onDateRangeChange({ from: '', to: '' })
    onActivityTypeChange('all')
    onSearchChange('')
  }

  const handleForceRefresh = () => {
    clearCache()
    onRefresh()
  }

  const hasActiveFilters = selectedRepos.length > 0 || dateRange.from || dateRange.to || activityType !== 'all' || searchQuery
  const activeType = ACTIVITY_TYPES.find(t => t.value === activityType) || ACTIVITY_TYPES[0]

  return (
    <aside 
      className={`fixed left-0 top-[73px] bottom-0 w-80 bg-void-800/50 backdrop-blur-xl border-r border-void-600/50 overflow-y-auto transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 space-y-5">
        {/* Search */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-frost-200">
            <Search className="w-4 h-4 text-electric-400" />
            Search Activities
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search commits, PRs, messages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 focus:ring-1 focus:ring-electric-400/25 transition-all text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-frost-300/40 hover:text-frost-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Activity Type Filter - Comprehensive */}
        <div className="space-y-3">
          <button 
            onClick={() => setFilterExpanded(!filterExpanded)}
            className="flex items-center justify-between w-full text-sm font-medium text-frost-200"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-electric-400" />
              Activity Type
              {activityType !== 'all' && (
                <span className={`px-2 py-0.5 bg-${activeType.color}/20 text-${activeType.color} rounded-full text-xs`}>
                  {activeType.label}
                </span>
              )}
            </span>
            <span className="text-frost-300/40">{filterExpanded ? '−' : '+'}</span>
          </button>
          
          {filterExpanded && (
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => onActivityTypeChange(value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all group ${
                    activityType === value
                      ? `bg-${color}/15 border-${color}/50 text-${color}`
                      : 'bg-void-700/30 border-void-600/50 text-frost-300/60 hover:bg-void-700/50 hover:text-frost-200 hover:border-void-500/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activityType === value ? '' : 'group-hover:scale-110'} transition-transform`} />
                  <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range with Presets */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-frost-200">
            <Calendar className="w-4 h-4 text-electric-400" />
            Time Range
          </label>
          
          {/* Quick presets */}
          <div className="flex gap-1.5">
            {TIME_PRESETS.map(({ label, days }) => (
              <button
                key={label}
                onClick={() => handleTimePreset(days)}
                className="flex-1 px-2 py-1.5 bg-void-700/30 hover:bg-void-700/50 border border-void-600/50 rounded-lg text-xs text-frost-300/60 hover:text-frost-200 transition-all"
              >
                {label}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
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
          
          {(dateRange.from || dateRange.to) && (
            <button
              onClick={() => onDateRangeChange({ from: '', to: '' })}
              className="text-xs text-frost-300/40 hover:text-frost-200 transition-colors"
            >
              Clear dates
            </button>
          )}
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
              Active ({repos.length})
            </button>
            <button
              onClick={() => setShowAllRepos(true)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showAllRepos 
                  ? 'bg-electric-400/20 text-electric-400 border border-electric-400/30' 
                  : 'bg-void-700/30 text-frost-300/60 border border-void-600/50 hover:bg-void-700/50'
              }`}
            >
              All ({allRepos.length})
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
                      className="flex-shrink-0 mt-0.5 accent-electric-400"
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

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="p-3 bg-electric-400/5 border border-electric-400/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-electric-400 font-medium">Active Filters</span>
              <button
                onClick={clearFilters}
                className="text-xs text-frost-300/60 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activityType !== 'all' && (
                <span className="px-2 py-0.5 bg-electric-400/20 text-electric-400 rounded text-xs">
                  {activeType.label}
                </span>
              )}
              {(dateRange.from || dateRange.to) && (
                <span className="px-2 py-0.5 bg-purple-400/20 text-purple-400 rounded text-xs">
                  {dateRange.from || '...'} → {dateRange.to || '...'}
                </span>
              )}
              {selectedRepos.length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded text-xs">
                  {selectedRepos.length} repos
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 bg-teal-400/20 text-teal-400 rounded text-xs truncate max-w-24">
                  "{searchQuery}"
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-void-600/50 space-y-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-electric-400/25"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? (progress?.status || 'Loading...') : 'Refresh'}
          </button>
          
          <button
            onClick={handleForceRefresh}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-void-700/30 hover:bg-void-700/50 border border-void-600/50 rounded-xl text-frost-300/60 hover:text-frost-200 text-xs transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Clear Cache & Refresh
          </button>
        </div>
      </div>
    </aside>
  )
}
