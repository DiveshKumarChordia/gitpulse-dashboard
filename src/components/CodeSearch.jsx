import { useState, useEffect } from 'react'
import { 
  Search, FileCode, Folder, ExternalLink, Code2, Loader2, AlertCircle, 
  ChevronDown, ChevronUp, GitBranch, Check, FolderTree, ArrowRight,
  RotateCcw, Sparkles, GitCommit, Link, ChevronLeft, ChevronRight as ChevronRightIcon,
  AlertTriangle, GitPullRequest, GitMerge, MessageSquare, Calendar, User, Maximize2, Minimize2
} from 'lucide-react'
import { searchCode, getFileContent, fetchBranches, fetchRepoTree, unifiedSearch, searchCommits, searchPRs } from '../api/github'
import { FileTree } from './FileTree'
import { useToast } from './Toast'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'Ruby', 'PHP', 
  'C', 'C++', 'C#', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JSON', 'YAML', 'Markdown'
]

const ITEMS_PER_PAGE = 3

// ============ RESULT CARDS ============

function CommitResult({ commit, org }) {
  const repoName = commit.repository?.name || 'unknown'
  const repoFullName = commit.repository?.fullName || `${org}/${repoName}`
  const commitUrl = commit.url || `https://github.com/${repoFullName}/commit/${commit.sha}`
  const repoUrl = `https://github.com/${repoFullName}`
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl overflow-hidden hover:border-neon-green/30 transition-all group">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-neon-green/10 rounded-lg flex-shrink-0">
            <GitCommit className="w-4 h-4 text-neon-green" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2 py-0.5 bg-neon-green/20 text-neon-green rounded font-medium">Commit</span>
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded hover:bg-yellow-400/30 transition-colors">
                {repoName}
              </a>
              <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-frost-300/50 hover:text-electric-400 transition-colors">
                {commit.shortSha}
              </a>
            </div>
            <h3 className="text-frost-100 font-medium line-clamp-2">{commit.message}</h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-frost-300/60">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {commit.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(commit.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-void-600/30">
              <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-neon-green hover:text-neon-green/80 transition-colors">
                <GitCommit className="w-3 h-3" />View commit
              </a>
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors">
                <Folder className="w-3 h-3" />View repo
              </a>
              <a href={`${repoUrl}/commits`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors">
                <GitBranch className="w-3 h-3" />All commits
              </a>
            </div>
          </div>
          <a 
            href={commitUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 hover:bg-void-600/50 rounded-lg transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4 text-frost-300/60 group-hover:text-neon-green" />
          </a>
        </div>
      </div>
    </div>
  )
}

function PRResult({ pr, org }) {
  const repoName = pr.repository?.name || 'unknown'
  const repoFullName = pr.repository?.fullName || `${org}/${repoName}`
  const prUrl = pr.url || `https://github.com/${repoFullName}/pull/${pr.number}`
  const repoUrl = `https://github.com/${repoFullName}`
  
  const stateColors = {
    open: 'bg-green-500/20 text-green-400',
    closed: 'bg-red-500/20 text-red-400',
    merged: 'bg-purple-500/20 text-purple-400',
  }
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl overflow-hidden hover:border-purple-400/30 transition-all group">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
            {pr.state === 'merged' ? (
              <GitMerge className="w-4 h-4 text-purple-400" />
            ) : (
              <GitPullRequest className="w-4 h-4 text-purple-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded font-medium">PR</span>
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded hover:bg-yellow-400/30 transition-colors">
                {repoName}
              </a>
              <span className={`text-xs px-2 py-0.5 rounded capitalize ${stateColors[pr.state] || stateColors.open}`}>
                {pr.state}
              </span>
              <a href={prUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-frost-300/50 hover:text-electric-400 transition-colors">
                #{pr.number}
              </a>
            </div>
            <h3 className="text-frost-100 font-medium line-clamp-2">{pr.title}</h3>
            {pr.body && (
              <p className="text-xs text-frost-300/50 mt-1 line-clamp-2">{pr.body}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-frost-300/60">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {pr.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(pr.date).toLocaleDateString()}
              </span>
            </div>
            {pr.labels && pr.labels.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {pr.labels.slice(0, 5).map(label => (
                  <span 
                    key={label.name}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ 
                      backgroundColor: `#${label.color}20`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-void-600/30">
              <a href={prUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                <GitPullRequest className="w-3 h-3" />View PR
              </a>
              <a href={`${prUrl}/commits`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors">
                <GitCommit className="w-3 h-3" />PR commits
              </a>
              <a href={`${prUrl}/files`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors">
                <FileCode className="w-3 h-3" />Files changed
              </a>
            </div>
          </div>
          <a 
            href={prUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 hover:bg-void-600/50 rounded-lg transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4 text-frost-300/60 group-hover:text-purple-400" />
          </a>
        </div>
      </div>
    </div>
  )
}

function CodePreview({ result, token, org, selectedBranches }) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const branch = selectedBranches?.length > 0 ? selectedBranches[0] : 'main'
  const repoName = result.repository?.name || 'unknown'
  const repoFullName = result.repository?.fullName || `${org}/${repoName}`
  const branchUrl = `https://github.com/${repoFullName}/tree/${branch}`
  const fileUrlWithBranch = `https://github.com/${repoFullName}/blob/${branch}/${result.path}`
  const repoUrl = `https://github.com/${repoFullName}`

  const loadContent = async () => {
    if (content) {
      setExpanded(!expanded)
      return
    }
    
    setLoading(true)
    try {
      const fileContent = await getFileContent(token, org, repoName, result.path, branch)
      setContent(fileContent)
      setExpanded(true)
    } catch (e) {
      toast.apiError(e.message || 'Failed to load file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl overflow-hidden hover:border-electric-400/30 transition-all group">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-electric-400/10 rounded-lg flex-shrink-0">
              <FileCode className="w-4 h-4 text-electric-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs px-2 py-0.5 bg-electric-400/20 text-electric-400 rounded font-medium">Code</span>
                <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded hover:bg-yellow-400/30 transition-colors">
                  {repoName}
                </a>
                <a href={branchUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 bg-frost-300/10 text-frost-300/60 rounded flex items-center gap-1 hover:bg-frost-300/20 transition-colors">
                  <GitBranch className="w-3 h-3" />{branch}
                </a>
              </div>
              <h3 className="text-frost-100 font-medium truncate">{result.name}</h3>
              <p className="text-xs text-frost-300/60 font-mono truncate mt-0.5">{result.path}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a href={branchUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-void-600/50 rounded-lg transition-colors"><GitBranch className="w-4 h-4 text-frost-300/60 hover:text-electric-400" /></a>
            <button onClick={loadContent} disabled={loading} className="p-2 hover:bg-void-600/50 rounded-lg transition-colors">
              {loading ? <Loader2 className="w-4 h-4 text-frost-300/60 animate-spin" /> : expanded ? <ChevronUp className="w-4 h-4 text-frost-300/60" /> : <ChevronDown className="w-4 h-4 text-frost-300/60" />}
            </button>
            <a href={fileUrlWithBranch} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-void-600/50 rounded-lg transition-colors"><ExternalLink className="w-4 h-4 text-frost-300/60 group-hover:text-electric-400" /></a>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-void-600/30">
          <a href={fileUrlWithBranch} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-electric-400 hover:text-electric-500 transition-colors"><Link className="w-3 h-3" />View in {branch}</a>
          <a href={branchUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors"><GitBranch className="w-3 h-3" />Browse branch</a>
          <a href={`https://github.com/${repoFullName}/commits/${branch}/${result.path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors"><GitCommit className="w-3 h-3" />File history</a>
        </div>
        {result.textMatches && result.textMatches.length > 0 && (
          <div className="mt-3 space-y-2">
            {result.textMatches.slice(0, 3).map((match, i) => (
              <div key={i} className="bg-void-900/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                <HighlightedFragment fragment={match.fragment} matches={match.matches} />
              </div>
            ))}
          </div>
        )}
      </div>
      {expanded && content && (
        <div className="border-t border-void-600/50">
          <pre className="p-4 text-xs font-mono text-frost-300/80 overflow-x-auto max-h-96 overflow-y-auto bg-void-900/30"><code>{content}</code></pre>
        </div>
      )}
    </div>
  )
}

function HighlightedFragment({ fragment, matches }) {
  if (!matches || matches.length === 0) return <span className="text-frost-300/70">{fragment}</span>
  const parts = []
  let lastIndex = 0
  for (const match of matches) {
    if (match.indices && match.indices.length >= 2) {
      const [start, end] = match.indices
      if (start > lastIndex) parts.push(<span key={`pre-${start}`} className="text-frost-300/70">{fragment.slice(lastIndex, start)}</span>)
      parts.push(<span key={`match-${start}`} className="bg-yellow-400/30 text-yellow-200 px-0.5 rounded">{fragment.slice(start, end)}</span>)
      lastIndex = end
    }
  }
  if (lastIndex < fragment.length) parts.push(<span key="post" className="text-frost-300/70">{fragment.slice(lastIndex)}</span>)
  return <>{parts.length > 0 ? parts : <span className="text-frost-300/70">{fragment}</span>}</>
}

function StepIndicator({ step, currentStep, label, icon: Icon }) {
  const isActive = currentStep === step
  const isComplete = currentStep > step
  return (
    <div className={`flex items-center gap-2 ${isActive ? 'text-electric-400' : isComplete ? 'text-neon-green' : 'text-frost-300/40'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'border-electric-400 bg-electric-400/10' : isComplete ? 'border-neon-green bg-neon-green/10' : 'border-frost-300/20'}`}>
        {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      </div>
      <span className={`text-sm font-medium hidden md:block ${isActive ? 'text-frost-100' : ''}`}>{label}</span>
    </div>
  )
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} className="p-2 rounded-lg bg-void-700/50 hover:bg-void-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4 text-frost-200" /></button>
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const pageNum = totalPages <= 5 ? i : Math.min(Math.max(currentPage - 2, 0), totalPages - 5) + i
          return (
            <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum ? 'bg-electric-400 text-void-900' : 'bg-void-700/50 text-frost-300/60 hover:bg-void-700 hover:text-frost-200'}`}>{pageNum + 1}</button>
          )
        })}
      </div>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} className="p-2 rounded-lg bg-void-700/50 hover:bg-void-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRightIcon className="w-4 h-4 text-frost-200" /></button>
    </div>
  )
}

// Resizable card component
function ResizableCard({ children, title, count, total, expanded, onToggleExpand, className = '' }) {
  return (
    <div className={`bg-void-700/30 border border-void-600/50 rounded-xl flex flex-col transition-all ${expanded ? 'col-span-full' : ''} ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-void-600/30">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-yellow-400" />
          <span className="font-medium text-frost-100 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-frost-300/60 px-2 py-0.5 bg-void-600/50 rounded">{count}/{total}</span>
          <button onClick={onToggleExpand} className="p-1 hover:bg-void-600/50 rounded transition-colors" title={expanded ? 'Minimize' : 'Expand'}>
            {expanded ? <Minimize2 className="w-4 h-4 text-frost-300/60" /> : <Maximize2 className="w-4 h-4 text-frost-300/60" />}
          </button>
        </div>
      </div>
      <div className={`flex-1 overflow-hidden ${expanded ? 'max-h-[500px]' : 'max-h-64'}`}>
        {children}
      </div>
    </div>
  )
}

function RepoBranchCard({ repo, branches, selectedBranches, onToggleBranch, onSelectAll, branchSearch, expanded, onToggleExpand, isSingle }) {
  const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase()))
  const allSelected = filteredBranches.length > 0 && filteredBranches.every(b => selectedBranches.has(b.name))
  
  return (
    <div className={`bg-void-700/30 border border-void-600/50 rounded-xl flex flex-col transition-all ${expanded ? 'col-span-full' : ''} ${isSingle ? 'col-span-full max-w-2xl mx-auto' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b border-void-600/30">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-yellow-400" />
          <span className="font-medium text-frost-100 truncate">{repo.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-frost-300/60 px-2 py-0.5 bg-void-600/50 rounded">{selectedBranches.size}/{branches.length}</span>
          <button onClick={onToggleExpand} className="p-1 hover:bg-void-600/50 rounded transition-colors" title={expanded ? 'Minimize' : 'Expand'}>
            {expanded ? <Minimize2 className="w-4 h-4 text-frost-300/60" /> : <Maximize2 className="w-4 h-4 text-frost-300/60" />}
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <button onClick={onSelectAll} className="text-xs text-electric-400 hover:text-electric-500 transition-colors mb-3 text-left">{allSelected ? 'Clear all' : 'Select all'}</button>
        <div className={`flex-1 overflow-y-auto space-y-1.5 ${expanded ? 'max-h-96' : isSingle ? 'max-h-64' : 'max-h-48'}`}>
          {filteredBranches.length === 0 ? <p className="text-xs text-frost-300/40 italic">No branches match</p> : filteredBranches.map(branch => (
            <button key={branch.name} onClick={() => onToggleBranch(branch.name)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${selectedBranches.has(branch.name) ? 'bg-electric-400/20 text-electric-400 border border-electric-400/30' : 'bg-void-600/30 text-frost-300/60 border border-transparent hover:border-frost-300/20'}`}>
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selectedBranches.has(branch.name) ? 'bg-electric-400 border-electric-400' : 'border-current'}`}>{selectedBranches.has(branch.name) && <Check className="w-3 h-3 text-void-900" />}</div>
              <GitBranch className="w-3 h-3 flex-shrink-0" /><span className="truncate">{branch.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function RepoFileTreeCard({ repo, tree, selectedPaths, onTogglePath, loading, expanded, onToggleExpand, isSingle }) {
  return (
    <div className={`bg-void-700/30 border border-void-600/50 rounded-xl flex flex-col transition-all ${expanded ? 'col-span-full' : ''} ${isSingle ? 'col-span-full max-w-2xl mx-auto' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b border-void-600/30">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-yellow-400" />
          <span className="font-medium text-frost-100 truncate">{repo.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-frost-300/60 px-2 py-0.5 bg-void-600/50 rounded">{selectedPaths.size} selected</span>
          <button onClick={onToggleExpand} className="p-1 hover:bg-void-600/50 rounded transition-colors" title={expanded ? 'Minimize' : 'Expand'}>
            {expanded ? <Minimize2 className="w-4 h-4 text-frost-300/60" /> : <Maximize2 className="w-4 h-4 text-frost-300/60" />}
          </button>
        </div>
      </div>
      <div className={`flex-1 overflow-hidden p-4 ${expanded ? 'max-h-[500px]' : isSingle ? 'max-h-80' : 'max-h-64'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-electric-400 animate-spin" /></div>
        ) : (
          <div className="h-full overflow-auto"><FileTree tree={tree} selectedPaths={selectedPaths} onSelect={onTogglePath} /></div>
        )}
      </div>
    </div>
  )
}

// ============ QUICK SEARCH (Entire Org) ============

function QuickSearch({ token, org, onResults }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTypes, setSearchTypes] = useState({ code: true, commits: true, prs: true })
  const toast = useToast()

  const handleQuickSearch = async (e) => {
    e.preventDefault()
    if (!query.trim() || !token || !org) return
    
    const activeTypes = Object.entries(searchTypes).filter(([_, v]) => v).map(([k]) => k)
    if (activeTypes.length === 0) {
      toast.warning('Select at least one search type')
      return
    }
    
    setLoading(true)
    try {
      const results = await unifiedSearch(token, query, org, { searchTypes: activeTypes })
      const totalResults = results.code.items.length + results.commits.items.length + results.prs.items.length
      
      if (totalResults === 0) {
        toast.info('No results found', 'Try a different search term')
      } else {
        toast.success(`Found ${totalResults} results`)
      }
      onResults(results)
    } catch (err) {
      toast.apiError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleType = (type) => {
    setSearchTypes(prev => ({ ...prev, [type]: !prev[type] }))
  }

  return (
    <div className="bg-gradient-to-br from-neon-green/10 via-electric-400/5 to-purple-500/10 border border-neon-green/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-green/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-neon-green" />
          </div>
          <div>
            <h3 className="text-frost-100 font-semibold">Quick Search - Entire Organization</h3>
            <p className="text-xs text-frost-300/60">Search code, commits, and PRs across all repos</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => toggleType('code')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${searchTypes.code ? 'bg-electric-400/20 text-electric-400 border border-electric-400/30' : 'bg-void-700/30 text-frost-300/60 border border-void-600/50'}`}
        >
          <FileCode className="w-4 h-4" /> Code
        </button>
        <button
          onClick={() => toggleType('commits')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${searchTypes.commits ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-void-700/30 text-frost-300/60 border border-void-600/50'}`}
        >
          <GitCommit className="w-4 h-4" /> Commits
        </button>
        <button
          onClick={() => toggleType('prs')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${searchTypes.prs ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' : 'bg-void-700/30 text-frost-300/60 border border-void-600/50'}`}
        >
          <GitPullRequest className="w-4 h-4" /> Pull Requests
        </button>
      </div>
      
      <form onSubmit={handleQuickSearch} className="flex gap-2">
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search for anything..." 
          className="flex-1 px-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-neon-green/50 focus:ring-2 focus:ring-neon-green/25" 
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()} 
          className="px-6 py-3 bg-gradient-to-r from-neon-green to-electric-400 text-void-900 font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search Org
        </button>
      </form>
    </div>
  )
}

// ============ RESULTS TABS ============

function ResultsTabs({ results, activeTab, onTabChange }) {
  const tabs = [
    { key: 'all', label: 'All', count: results.code.items.length + results.commits.items.length + results.prs.items.length, icon: Search },
    { key: 'code', label: 'Code', count: results.code.items.length, icon: FileCode, color: 'electric-400' },
    { key: 'commits', label: 'Commits', count: results.commits.items.length, icon: GitCommit, color: 'neon-green' },
    { key: 'prs', label: 'PRs', count: results.prs.items.length, icon: GitPullRequest, color: 'purple-400' },
  ]
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === tab.key 
              ? 'bg-frost-100 text-void-900' 
              : 'bg-void-700/50 text-frost-300/60 hover:text-frost-200 hover:bg-void-700'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
          <span className={`px-2 py-0.5 rounded text-xs ${activeTab === tab.key ? 'bg-void-900/20' : 'bg-void-600/50'}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}

// ============ MAIN COMPONENT ============

export function CodeSearch({ token, org, allRepos }) {
  const [step, setStep] = useState(1)
  const [selectedRepos, setSelectedRepos] = useState([])
  const [repoSearch, setRepoSearch] = useState('')
  const [branchesMap, setBranchesMap] = useState({})
  const [selectedBranchesMap, setSelectedBranchesMap] = useState({})
  const [branchSearch, setBranchSearch] = useState('')
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branchPage, setBranchPage] = useState(0)
  const [expandedBranchCards, setExpandedBranchCards] = useState({})
  const [treesMap, setTreesMap] = useState({})
  const [selectedPathsMap, setSelectedPathsMap] = useState({})
  const [loadingTrees, setLoadingTrees] = useState({})
  const [filePage, setFilePage] = useState(0)
  const [expandedFileCards, setExpandedFileCards] = useState({})
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('')
  const [extension, setExtension] = useState('')
  const [searchTypes, setSearchTypes] = useState({ code: true, commits: true, prs: true })
  const [activeResultsTab, setActiveResultsTab] = useState('all')
  
  const toast = useToast()

  if (!token || !org) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium">Missing Configuration</p>
        <p className="text-sm text-red-400/70 mt-1">{!token && 'No token. '}{!org && 'No organization selected.'}</p>
      </div>
    )
  }

  const filteredRepos = (allRepos || []).filter(repo => repo.name.toLowerCase().includes(repoSearch.toLowerCase()))

  const handleToggleRepo = (repo) => {
    setSelectedRepos(prev => prev.find(r => r.name === repo.name) ? prev.filter(r => r.name !== repo.name) : [...prev, repo])
  }

  const handleSelectAllRepos = () => {
    setSelectedRepos(selectedRepos.length === filteredRepos.length ? [] : [...filteredRepos])
  }

  const handleConfirmRepos = async () => {
    if (selectedRepos.length === 0) return
    setStep(2)
    setLoadingBranches(true)
    setBranchPage(0)
    setExpandedBranchCards({})
    
    const newBranchesMap = {}
    const newSelectedBranchesMap = {}
    
    for (const repo of selectedRepos) {
      try {
        const branches = await fetchBranches(token, org, repo.name)
        newBranchesMap[repo.name] = branches
        const defaultBranch = branches.find(b => b.name === repo.defaultBranch) || branches[0]
        newSelectedBranchesMap[repo.name] = new Set(defaultBranch ? [defaultBranch.name] : [])
      } catch (e) {
        toast.warning(`Failed to load branches for ${repo.name}`)
        newBranchesMap[repo.name] = []
        newSelectedBranchesMap[repo.name] = new Set()
      }
    }
    
    setBranchesMap(newBranchesMap)
    setSelectedBranchesMap(newSelectedBranchesMap)
    setLoadingBranches(false)
    toast.info(`Loaded branches for ${selectedRepos.length} repos`)
  }

  const handleToggleBranch = (repoName, branchName) => {
    setSelectedBranchesMap(prev => {
      const repoSet = new Set(prev[repoName] || [])
      repoSet.has(branchName) ? repoSet.delete(branchName) : repoSet.add(branchName)
      return { ...prev, [repoName]: repoSet }
    })
  }

  const handleSelectAllBranchesForRepo = (repoName) => {
    const branches = (branchesMap[repoName] || []).filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase()))
    const currentSelected = selectedBranchesMap[repoName] || new Set()
    const allSelected = branches.every(b => currentSelected.has(b.name))
    setSelectedBranchesMap(prev => ({ ...prev, [repoName]: allSelected ? new Set() : new Set(branches.map(b => b.name)) }))
  }

  const totalSelectedBranches = Object.values(selectedBranchesMap).reduce((sum, set) => sum + set.size, 0)

  const handleConfirmBranches = async () => {
    if (totalSelectedBranches === 0) {
      toast.warning('Please select at least one branch')
      return
    }
    setStep(3)
    setFilePage(0)
    setExpandedFileCards({})
    
    const newSelectedPathsMap = {}
    selectedRepos.forEach(repo => { newSelectedPathsMap[repo.name] = new Set() })
    setSelectedPathsMap(newSelectedPathsMap)
    
    const newLoadingTrees = {}
    selectedRepos.forEach(repo => { newLoadingTrees[repo.name] = true })
    setLoadingTrees(newLoadingTrees)
    
    for (const repo of selectedRepos) {
      const branches = selectedBranchesMap[repo.name]
      const firstBranch = Array.from(branches)[0] || repo.defaultBranch || 'main'
      try {
        const tree = await fetchRepoTree(token, org, repo.name, firstBranch)
        setTreesMap(prev => ({ ...prev, [repo.name]: tree }))
      } catch (e) {
        toast.warning(`Failed to load files for ${repo.name}`)
        setTreesMap(prev => ({ ...prev, [repo.name]: [] }))
      }
      setLoadingTrees(prev => ({ ...prev, [repo.name]: false }))
    }
  }

  const handleTogglePath = (repoName) => (path, isFolder, node) => {
    setSelectedPathsMap(prev => {
      const repoPaths = new Set(prev[repoName] || [])
      if (repoPaths.has(path)) {
        repoPaths.delete(path)
        if (isFolder && node.children) {
          const removeChildren = (n) => { repoPaths.delete(n.path); if (n.children) n.children.forEach(removeChildren) }
          node.children.forEach(removeChildren)
        }
      } else {
        repoPaths.add(path)
        if (isFolder && node.children) {
          const addChildren = (n) => { repoPaths.add(n.path); if (n.children) n.children.forEach(addChildren) }
          node.children.forEach(addChildren)
        }
      }
      return { ...prev, [repoName]: repoPaths }
    })
  }

  const handleProceedToSearch = () => setStep(4)
  const totalSelectedPaths = Object.values(selectedPathsMap).reduce((sum, set) => sum + set.size, 0)

  const toggleSearchType = (type) => {
    setSearchTypes(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) {
      toast.warning('Please enter a search term')
      return
    }
    
    const activeTypes = Object.entries(searchTypes).filter(([_, v]) => v).map(([k]) => k)
    if (activeTypes.length === 0) {
      toast.warning('Select at least one search type')
      return
    }
    
    setLoading(true)
    setResults(null)
    
    try {
      const allBranches = []
      Object.entries(selectedBranchesMap).forEach(([_, branches]) => {
        allBranches.push(...Array.from(branches))
      })
      
      const allPaths = []
      Object.entries(selectedPathsMap).forEach(([_, paths]) => {
        allPaths.push(...Array.from(paths))
      })
      
      const repoNames = selectedRepos.map(r => r.name)
      
      const searchResults = await unifiedSearch(token, query, org, {
        repos: repoNames,
        branches: [...new Set(allBranches)],
        paths: allPaths,
        language: language || undefined,
        extension: extension || undefined,
        searchTypes: activeTypes,
      })
      
      // Add branch info to results
      searchResults.code.items.forEach(item => {
        item.searchedBranches = allBranches
      })
      
      setResults(searchResults)
      
      const totalResults = searchResults.code.items.length + searchResults.commits.items.length + searchResults.prs.items.length
      
      if (totalResults > 0) {
        toast.success(`Found ${totalResults} results`)
      } else {
        toast.info('No results found', 'Try different search terms')
      }
    } catch (err) {
      toast.apiError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setSelectedRepos([])
    setBranchesMap({})
    setSelectedBranchesMap({})
    setTreesMap({})
    setSelectedPathsMap({})
    setQuery('')
    setResults(null)
    setLanguage('')
    setExtension('')
    setRepoSearch('')
    setBranchSearch('')
    setBranchPage(0)
    setFilePage(0)
    setActiveResultsTab('all')
    setExpandedBranchCards({})
    setExpandedFileCards({})
  }

  const handleQuickSearchResults = (results) => {
    setResults(results)
    setStep(4)
    setActiveResultsTab('all')
  }

  // Calculate items per page based on selection count
  const itemsPerPage = selectedRepos.length === 1 ? 1 : selectedRepos.length === 2 ? 2 : ITEMS_PER_PAGE
  
  const branchTotalPages = Math.ceil(selectedRepos.length / itemsPerPage)
  const branchPageRepos = selectedRepos.slice(branchPage * itemsPerPage, (branchPage + 1) * itemsPerPage)
  const fileTotalPages = Math.ceil(selectedRepos.length / itemsPerPage)
  const filePageRepos = selectedRepos.slice(filePage * itemsPerPage, (filePage + 1) * itemsPerPage)

  // Get filtered results based on active tab
  const getFilteredResults = () => {
    if (!results) return []
    
    switch (activeResultsTab) {
      case 'code':
        return results.code.items.map(item => ({ ...item, resultType: 'code' }))
      case 'commits':
        return results.commits.items.map(item => ({ ...item, resultType: 'commit' }))
      case 'prs':
        return results.prs.items.map(item => ({ ...item, resultType: 'pr' }))
      default:
        return [
          ...results.commits.items.map(item => ({ ...item, resultType: 'commit' })),
          ...results.prs.items.map(item => ({ ...item, resultType: 'pr' })),
          ...results.code.items.map(item => ({ ...item, resultType: 'code' })),
        ]
    }
  }

  // Get grid class based on count
  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1 max-w-2xl mx-auto'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2'
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <div className="space-y-6">
      <QuickSearch token={token} org={org} onResults={handleQuickSearchResults} />

      <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-neon-pink to-purple-500 rounded-xl"><Code2 className="w-5 h-5 text-white" /></div>
            <div><h2 className="text-lg font-display font-semibold text-frost-100">Advanced Search</h2><p className="text-sm text-frost-300/60">Select repos → branches → files → search code, commits & PRs</p></div>
          </div>
          {step > 1 && <button onClick={handleReset} className="flex items-center gap-2 px-3 py-1.5 text-sm text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50 rounded-lg transition-all"><RotateCcw className="w-4 h-4" />Start Over</button>}
        </div>

        <div className="flex items-center justify-between mb-8">
          <StepIndicator step={1} currentStep={step} label="Repositories" icon={Folder} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={2} currentStep={step} label="Branches" icon={GitBranch} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={3} currentStep={step} label="Files" icon={FolderTree} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={4} currentStep={step} label="Search" icon={Search} />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" /><input type="text" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} placeholder="Search repositories..." className="w-full pl-10 pr-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 transition-all" /></div>
              <button onClick={handleSelectAllRepos} className="px-4 py-2.5 text-sm text-electric-400 hover:text-electric-500 hover:bg-electric-400/10 rounded-xl transition-all">{selectedRepos.length === filteredRepos.length ? 'Clear all' : 'Select all'}</button>
            </div>
            <div className="text-sm text-frost-300/60">{selectedRepos.length} of {filteredRepos.length} selected</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filteredRepos.map(repo => {
                const isSelected = selectedRepos.some(r => r.name === repo.name)
                return (
                  <button key={repo.name} onClick={() => handleToggleRepo(repo)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-electric-400/10 border-electric-400/50' : 'bg-void-700/30 border-void-600/50 hover:border-frost-300/30'}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-electric-400 border-electric-400' : 'border-frost-300/30'}`}>{isSelected && <Check className="w-3 h-3 text-void-900" />}</div>
                    <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-electric-400' : 'text-yellow-400'}`} /><span className={`text-sm truncate ${isSelected ? 'text-electric-400' : 'text-frost-200'}`}>{repo.name}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={handleConfirmRepos} disabled={selectedRepos.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">Continue with {selectedRepos.length} repo{selectedRepos.length !== 1 ? 's' : ''}<ArrowRight className="w-4 h-4" /></button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-frost-300/60">{totalSelectedBranches} branches selected across {selectedRepos.length} repo{selectedRepos.length !== 1 ? 's' : ''}</span><button onClick={() => setStep(1)} className="text-sm text-frost-300/60 hover:text-frost-200 transition-colors">Change repos</button></div>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" /><input type="text" value={branchSearch} onChange={(e) => setBranchSearch(e.target.value)} placeholder="Search branches..." className="w-full pl-10 pr-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 transition-all" /></div>
            {loadingBranches ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-electric-400 animate-spin" /></div> : (
              <>
                <div className={`grid gap-4 ${getGridClass(branchPageRepos.length)}`}>
                  {branchPageRepos.map(repo => (
                    <RepoBranchCard 
                      key={repo.name} 
                      repo={repo} 
                      branches={branchesMap[repo.name] || []} 
                      selectedBranches={selectedBranchesMap[repo.name] || new Set()} 
                      onToggleBranch={(bn) => handleToggleBranch(repo.name, bn)} 
                      onSelectAll={() => handleSelectAllBranchesForRepo(repo.name)} 
                      branchSearch={branchSearch}
                      expanded={expandedBranchCards[repo.name]}
                      onToggleExpand={() => setExpandedBranchCards(prev => ({ ...prev, [repo.name]: !prev[repo.name] }))}
                      isSingle={selectedRepos.length === 1}
                    />
                  ))}
                </div>
                <Pagination currentPage={branchPage} totalPages={branchTotalPages} onPageChange={setBranchPage} />
                <button onClick={handleConfirmBranches} disabled={totalSelectedBranches === 0} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">Continue<ArrowRight className="w-4 h-4" /></button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-frost-300/60">Select files/folders (optional) - {selectedRepos.length} repo{selectedRepos.length !== 1 ? 's' : ''}</span><button onClick={() => setStep(2)} className="text-sm text-frost-300/60 hover:text-frost-200 transition-colors">Change branches</button></div>
            <div className={`grid gap-4 ${getGridClass(filePageRepos.length)}`} style={{ minHeight: selectedRepos.length === 1 ? '400px' : '320px' }}>
              {filePageRepos.map(repo => (
                <RepoFileTreeCard 
                  key={repo.name} 
                  repo={repo} 
                  tree={treesMap[repo.name] || []} 
                  selectedPaths={selectedPathsMap[repo.name] || new Set()} 
                  onTogglePath={handleTogglePath(repo.name)} 
                  loading={loadingTrees[repo.name]}
                  expanded={expandedFileCards[repo.name]}
                  onToggleExpand={() => setExpandedFileCards(prev => ({ ...prev, [repo.name]: !prev[repo.name] }))}
                  isSingle={selectedRepos.length === 1}
                />
              ))}
            </div>
            <Pagination currentPage={filePage} totalPages={fileTotalPages} onPageChange={setFilePage} />
            <div className="flex gap-3">
              <button onClick={() => { const c = {}; selectedRepos.forEach(r => c[r.name] = new Set()); setSelectedPathsMap(c) }} className="flex-1 px-4 py-3 bg-void-700/50 hover:bg-void-700 border border-void-600/50 rounded-xl text-frost-300 font-medium transition-all">Clear All</button>
              <button onClick={handleProceedToSearch} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all">{totalSelectedPaths > 0 ? `Search in ${totalSelectedPaths} items` : 'Search All Files'}<ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 p-3 bg-void-700/30 rounded-xl text-sm">
              <span className="text-frost-300/60">Scope:</span>
              <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded font-medium">{selectedRepos.length} repos</span>
              <span className="px-2 py-1 bg-electric-400/20 text-electric-400 rounded">{totalSelectedBranches} branches</span>
              {totalSelectedPaths > 0 && <span className="px-2 py-1 bg-neon-pink/20 text-neon-pink rounded">{totalSelectedPaths} paths</span>}
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-frost-300/60 hover:text-frost-200 transition-colors">Modify</button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-sm text-frost-300/60 self-center">Search in:</span>
              <button
                onClick={() => toggleSearchType('code')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${searchTypes.code ? 'bg-electric-400/20 text-electric-400 border border-electric-400/30' : 'bg-void-700/30 text-frost-300/60 border border-void-600/50'}`}
              >
                <FileCode className="w-4 h-4" /> Code
              </button>
              <button
                onClick={() => toggleSearchType('commits')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${searchTypes.commits ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-void-700/30 text-frost-300/60 border border-void-600/50'}`}
              >
                <GitCommit className="w-4 h-4" /> Commits
              </button>
              <button
                onClick={() => toggleSearchType('prs')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${searchTypes.prs ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' : 'bg-void-700/30 text-frost-300/60 border border-void-600/50'}`}
              >
                <GitPullRequest className="w-4 h-4" /> Pull Requests
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-frost-300/40" /><input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for code, commit messages, PR titles..." className="w-full pl-12 pr-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-neon-pink/50 focus:ring-2 focus:ring-neon-pink/25 transition-all" autoFocus /></div>
                <button type="submit" disabled={loading || !query.trim()} className="px-6 py-3 bg-gradient-to-r from-neon-pink to-purple-500 hover:from-neon-pink/90 hover:to-purple-500/90 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}Search</button>
              </div>
              <div className="flex gap-3">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 text-sm focus:outline-none focus:border-electric-400/50 appearance-none cursor-pointer"><option value="">Any language</option>{LANGUAGES.map(l => <option key={l} value={l.toLowerCase()}>{l}</option>)}</select>
                <input type="text" value={extension} onChange={(e) => setExtension(e.target.value)} placeholder="Extension" className="px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-electric-400/50 w-32" />
              </div>
            </form>
          </div>
        )}
      </div>

      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-frost-200 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-pink" />
              Search Results
            </h3>
          </div>
          
          <ResultsTabs results={results} activeTab={activeResultsTab} onTabChange={setActiveResultsTab} />
          
          {getFilteredResults().length === 0 ? (
            <div className="text-center py-12 text-frost-300/60"><Folder className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No results in this category</p></div>
          ) : (
            <div className="space-y-3">
              {getFilteredResults().map((result, i) => {
                if (result.resultType === 'commit') {
                  return <CommitResult key={`commit-${result.sha}-${i}`} commit={result} org={org} />
                }
                if (result.resultType === 'pr') {
                  return <PRResult key={`pr-${result.number}-${i}`} pr={result} org={org} />
                }
                return <CodePreview key={`code-${result.path}-${i}`} result={result} token={token} org={org} selectedBranches={result.searchedBranches || []} />
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
