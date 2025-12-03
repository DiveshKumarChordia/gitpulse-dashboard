/**
 * Repository Selector Component
 * Dropdown to select a specific repo or view all
 */

import { useState, useRef, useEffect } from 'react'
import { Folder, ChevronDown, Search, X, Star, GitFork } from 'lucide-react'

export function RepoSelector({ repos, selectedRepo, onSelect }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const filteredRepos = repos.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase())
  )
  
  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center gap-3 px-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl hover:border-yellow-400/30 transition-all min-w-[200px]"
      >
        <Folder className="w-5 h-5 text-yellow-400" />
        <span className="text-frost-200 font-medium flex-1 text-left truncate">
          {selectedRepo?.name || 'All Repositories'}
        </span>
        <ChevronDown className={`w-4 h-4 text-frost-300/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-scaleIn">
          {/* Search */}
          <div className="p-3 border-b border-void-600/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-200 text-sm placeholder:text-frost-300/40 focus:outline-none focus:border-electric-400/50"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-frost-300/40 hover:text-frost-200" />
                </button>
              )}
            </div>
          </div>
          
          {/* All Repos Option */}
          <button 
            onClick={() => { onSelect(null); setOpen(false) }} 
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-void-700/50 transition-colors border-b border-void-600/30 ${
              !selectedRepo ? 'bg-yellow-400/10' : ''
            }`}
          >
            <div className="p-1.5 bg-yellow-400/20 rounded-lg">
              <Folder className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-frost-200 font-medium">All Repositories</span>
              <p className="text-xs text-frost-300/50">{repos.length} repos</p>
            </div>
            {!selectedRepo && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            )}
          </button>
          
          {/* Repo List */}
          <div className="max-h-72 overflow-y-auto">
            {filteredRepos.map(repo => (
              <button 
                key={repo.name} 
                onClick={() => { onSelect(repo); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-void-700/50 transition-colors ${
                  selectedRepo?.name === repo.name ? 'bg-yellow-400/10' : ''
                }`}
              >
                <Folder className="w-4 h-4 text-frost-300/60 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <span className="text-frost-200 truncate block">{repo.name}</span>
                  {repo.description && (
                    <p className="text-xs text-frost-300/50 truncate">{repo.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-frost-300/40 flex-shrink-0">
                  {repo.language && <span>{repo.language}</span>}
                  {repo.stargazersCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3" />{repo.stargazersCount}
                    </span>
                  )}
                </div>
                {selectedRepo?.name === repo.name && (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                )}
              </button>
            ))}
            
            {filteredRepos.length === 0 && (
              <div className="p-4 text-center text-frost-300/50 text-sm">
                No repositories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RepoSelector

