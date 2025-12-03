import { useState, useEffect } from 'react'
import { 
  Search, FileCode, Folder, ExternalLink, Code2, Loader2, AlertCircle, 
  ChevronDown, ChevronUp, GitBranch, Check, FolderTree, ArrowRight,
  RotateCcw, Sparkles, GitCommit, Link, ChevronLeft, ChevronRight as ChevronRightIcon,
  AlertTriangle
} from 'lucide-react'
import { searchCode, getFileContent, fetchBranches, fetchRepoTree } from '../api/github'
import { FileTree } from './FileTree'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'Ruby', 'PHP', 
  'C', 'C++', 'C#', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JSON', 'YAML', 'Markdown'
]

const ITEMS_PER_PAGE = 3

function CodePreview({ result, token, org, selectedBranches }) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)

  const branch = selectedBranches?.length > 0 ? selectedBranches[0] : 'main'
  const repoName = result.repository?.name || 'unknown'
  const branchUrl = `https://github.com/${org}/${repoName}/tree/${branch}`
  const fileUrlWithBranch = `https://github.com/${org}/${repoName}/blob/${branch}/${result.path}`

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
      console.error('Failed to load file:', e)
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
                <span className="text-xs px-2 py-0.5 bg-yellow-400/20 text-yellow-400 rounded font-medium">
                  {repoName}
                </span>
                <span className="text-xs px-2 py-0.5 bg-electric-400/20 text-electric-400 rounded flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {branch}
                </span>
              </div>
              <h3 className="text-frost-100 font-medium truncate">{result.name}</h3>
              <p className="text-xs text-frost-300/60 font-mono truncate mt-0.5">{result.path}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <a href={branchUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-void-600/50 rounded-lg transition-colors" title="Open branch">
              <GitBranch className="w-4 h-4 text-frost-300/60 hover:text-electric-400" />
            </a>
            <button onClick={loadContent} disabled={loading} className="p-2 hover:bg-void-600/50 rounded-lg transition-colors" title="Preview">
              {loading ? <Loader2 className="w-4 h-4 text-frost-300/60 animate-spin" /> : expanded ? <ChevronUp className="w-4 h-4 text-frost-300/60" /> : <ChevronDown className="w-4 h-4 text-frost-300/60" />}
            </button>
            <a href={fileUrlWithBranch} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-void-600/50 rounded-lg transition-colors" title="Open file">
              <ExternalLink className="w-4 h-4 text-frost-300/60 group-hover:text-electric-400" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-void-600/30">
          <a href={fileUrlWithBranch} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-electric-400 hover:text-electric-500 transition-colors">
            <Link className="w-3 h-3" />View in {branch}
          </a>
          <a href={branchUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors">
            <GitBranch className="w-3 h-3" />Browse branch
          </a>
          <a href={`https://github.com/${org}/${repoName}/commits/${branch}/${result.path}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors">
            <GitCommit className="w-3 h-3" />View commits
          </a>
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
          <pre className="p-4 text-xs font-mono text-frost-300/80 overflow-x-auto max-h-96 overflow-y-auto bg-void-900/30">
            <code>{content}</code>
          </pre>
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
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} className="p-2 rounded-lg bg-void-700/50 hover:bg-void-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="w-4 h-4 text-frost-200" />
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => (
          <button key={i} onClick={() => onPageChange(i)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === i ? 'bg-electric-400 text-void-900' : 'bg-void-700/50 text-frost-300/60 hover:bg-void-700 hover:text-frost-200'}`}>
            {i + 1}
          </button>
        ))}
      </div>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} className="p-2 rounded-lg bg-void-700/50 hover:bg-void-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronRightIcon className="w-4 h-4 text-frost-200" />
      </button>
    </div>
  )
}

function RepoBranchCard({ repo, branches, selectedBranches, onToggleBranch, onSelectAll, branchSearch }) {
  const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase()))
  const allSelected = filteredBranches.length > 0 && filteredBranches.every(b => selectedBranches.has(b.name))

  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-yellow-400" />
          <span className="font-medium text-frost-100 truncate">{repo.name}</span>
        </div>
        <span className="text-xs text-frost-300/60 px-2 py-0.5 bg-void-600/50 rounded">{selectedBranches.size}/{branches.length}</span>
      </div>
      <button onClick={onSelectAll} className="text-xs text-electric-400 hover:text-electric-500 transition-colors mb-3 text-left">
        {allSelected ? 'Clear all' : 'Select all'}
      </button>
      <div className="flex-1 overflow-y-auto max-h-48 space-y-1.5">
        {filteredBranches.length === 0 ? (
          <p className="text-xs text-frost-300/40 italic">No branches match search</p>
        ) : (
          filteredBranches.map(branch => (
            <button key={branch.name} onClick={() => onToggleBranch(branch.name)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${selectedBranches.has(branch.name) ? 'bg-electric-400/20 text-electric-400 border border-electric-400/30' : 'bg-void-600/30 text-frost-300/60 border border-transparent hover:border-frost-300/20'}`}>
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selectedBranches.has(branch.name) ? 'bg-electric-400 border-electric-400' : 'border-current'}`}>
                {selectedBranches.has(branch.name) && <Check className="w-3 h-3 text-void-900" />}
              </div>
              <GitBranch className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{branch.name}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function RepoFileTreeCard({ repo, tree, selectedPaths, onTogglePath, loading }) {
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Folder className="w-5 h-5 text-yellow-400" />
        <span className="font-medium text-frost-100 truncate">{repo.name}</span>
        <span className="text-xs text-frost-300/60 px-2 py-0.5 bg-void-600/50 rounded ml-auto">{selectedPaths.size} selected</span>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-electric-400 animate-spin" /></div>
      ) : (
        <div className="flex-1 overflow-hidden"><FileTree tree={tree} selectedPaths={selectedPaths} onSelect={onTogglePath} /></div>
      )}
    </div>
  )
}

// Quick Search component for testing
function QuickSearch({ token, org, onResults, onError }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const handleQuickSearch = async (e) => {
    e.preventDefault()
    if (!query.trim() || !token || !org) return
    
    setLoading(true)
    onError(null)
    
    try {
      console.log('Quick search - Token:', token ? 'present' : 'missing', 'Org:', org)
      const results = await searchCode(token, query, org, null, {})
      console.log('Quick search results:', results)
      onResults(results)
    } catch (err) {
      console.error('Quick search error:', err)
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-4 mb-6">
      <h3 className="text-neon-green font-medium mb-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> Quick Search (Test Mode)
      </h3>
      <p className="text-xs text-frost-300/60 mb-3">Search across entire organization without selecting repos</p>
      <form onSubmit={handleQuickSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type any word to search..."
          className="flex-1 px-4 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-neon-green/50"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-neon-green text-void-900 font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Test
        </button>
      </form>
    </div>
  )
}

export function CodeSearch({ token, org, allRepos }) {
  const [step, setStep] = useState(1)
  const [selectedRepos, setSelectedRepos] = useState([])
  const [repoSearch, setRepoSearch] = useState('')
  const [branchesMap, setBranchesMap] = useState({})
  const [selectedBranchesMap, setSelectedBranchesMap] = useState({})
  const [branchSearch, setBranchSearch] = useState('')
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [branchPage, setBranchPage] = useState(0)
  const [treesMap, setTreesMap] = useState({})
  const [selectedPathsMap, setSelectedPathsMap] = useState({})
  const [loadingTrees, setLoadingTrees] = useState({})
  const [filePage, setFilePage] = useState(0)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [language, setLanguage] = useState('')
  const [extension, setExtension] = useState('')

  // Debug: Log props
  useEffect(() => {
    console.log('CodeSearch props:', { token: token ? 'present' : 'missing', org, allReposCount: allRepos?.length })
  }, [token, org, allRepos])

  // Check if we have required props
  if (!token || !org) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium">Missing Configuration</p>
        <p className="text-sm text-red-400/70 mt-1">
          {!token && 'No token found. '}{!org && 'No organization selected.'}
        </p>
        <p className="text-xs text-frost-300/60 mt-2">Please complete the setup first.</p>
      </div>
    )
  }

  const filteredRepos = (allRepos || []).filter(repo => 
    repo.name.toLowerCase().includes(repoSearch.toLowerCase())
  )

  const handleToggleRepo = (repo) => {
    setSelectedRepos(prev => {
      const exists = prev.find(r => r.name === repo.name)
      if (exists) return prev.filter(r => r.name !== repo.name)
      return [...prev, repo]
    })
  }

  const handleSelectAllRepos = () => {
    if (selectedRepos.length === filteredRepos.length) setSelectedRepos([])
    else setSelectedRepos([...filteredRepos])
  }

  const handleConfirmRepos = async () => {
    if (selectedRepos.length === 0) return
    setStep(2)
    setLoadingBranches(true)
    setBranchPage(0)
    
    const newBranchesMap = {}
    const newSelectedBranchesMap = {}
    
    for (const repo of selectedRepos) {
      try {
        const branches = await fetchBranches(token, org, repo.name)
        newBranchesMap[repo.name] = branches
        const defaultBranch = branches.find(b => b.name === repo.defaultBranch) || branches[0]
        newSelectedBranchesMap[repo.name] = new Set(defaultBranch ? [defaultBranch.name] : [])
      } catch (e) {
        console.error(`Failed to load branches for ${repo.name}:`, e)
        newBranchesMap[repo.name] = []
        newSelectedBranchesMap[repo.name] = new Set()
      }
    }
    
    setBranchesMap(newBranchesMap)
    setSelectedBranchesMap(newSelectedBranchesMap)
    setLoadingBranches(false)
  }

  const handleToggleBranch = (repoName, branchName) => {
    setSelectedBranchesMap(prev => {
      const repoSet = new Set(prev[repoName] || [])
      if (repoSet.has(branchName)) repoSet.delete(branchName)
      else repoSet.add(branchName)
      return { ...prev, [repoName]: repoSet }
    })
  }

  const handleSelectAllBranchesForRepo = (repoName) => {
    const branches = (branchesMap[repoName] || []).filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase()))
    const currentSelected = selectedBranchesMap[repoName] || new Set()
    const allSelected = branches.every(b => currentSelected.has(b.name))
    if (allSelected) setSelectedBranchesMap(prev => ({ ...prev, [repoName]: new Set() }))
    else setSelectedBranchesMap(prev => ({ ...prev, [repoName]: new Set(branches.map(b => b.name)) }))
  }

  const totalSelectedBranches = Object.values(selectedBranchesMap).reduce((sum, set) => sum + set.size, 0)

  const handleConfirmBranches = async () => {
    if (totalSelectedBranches === 0) return
    setStep(3)
    setFilePage(0)
    
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
        console.error(`Failed to load tree for ${repo.name}:`, e)
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

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    setResults(null)
    
    console.log('Starting search:', { query, selectedRepos: selectedRepos.map(r => r.name), org })
    
    try {
      const allResults = []
      const errors = []
      
      for (const repo of selectedRepos) {
        const repoBranches = Array.from(selectedBranchesMap[repo.name] || [])
        const repoPaths = Array.from(selectedPathsMap[repo.name] || new Set())
        
        console.log(`Searching ${repo.name}:`, { repoBranches, repoPaths })
        
        try {
          const searchResults = await searchCode(token, query, org, repo.name, {
            branches: repoBranches,
            paths: repoPaths,
            language: language || undefined,
            extension: extension || undefined,
          })
          
          console.log(`Results for ${repo.name}:`, searchResults)
          
          if (searchResults && searchResults.items) {
            searchResults.items.forEach(item => { item.searchedBranches = repoBranches })
            allResults.push(...searchResults.items)
          }
        } catch (repoError) {
          console.error(`Search failed for ${repo.name}:`, repoError)
          errors.push(`${repo.name}: ${repoError.message}`)
        }
      }
      
      setResults({ totalCount: allResults.length, items: allResults, incompleteResults: false })
      
      if (errors.length > 0 && allResults.length === 0) {
        setError(errors.join('\n'))
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message || 'Search failed')
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
    setError(null)
    setLanguage('')
    setExtension('')
    setRepoSearch('')
    setBranchSearch('')
    setBranchPage(0)
    setFilePage(0)
  }

  const branchTotalPages = Math.ceil(selectedRepos.length / ITEMS_PER_PAGE)
  const branchPageRepos = selectedRepos.slice(branchPage * ITEMS_PER_PAGE, (branchPage + 1) * ITEMS_PER_PAGE)
  const fileTotalPages = Math.ceil(selectedRepos.length / ITEMS_PER_PAGE)
  const filePageRepos = selectedRepos.slice(filePage * ITEMS_PER_PAGE, (filePage + 1) * ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Quick Search for Testing */}
      <QuickSearch 
        token={token} 
        org={org} 
        onResults={(r) => { setResults(r); setStep(4) }}
        onError={setError}
      />

      {/* Main Header */}
      <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-neon-pink to-purple-500 rounded-xl"><Code2 className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-lg font-display font-semibold text-frost-100">Advanced Code Search</h2>
              <p className="text-sm text-frost-300/60">Select repos → branches → files → search</p>
            </div>
          </div>
          {step > 1 && (
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-1.5 text-sm text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50 rounded-lg transition-all">
              <RotateCcw className="w-4 h-4" />Start Over
            </button>
          )}
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

        {/* Step 1: Repository Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" />
                <input type="text" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} placeholder="Search repositories..." className="w-full pl-10 pr-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 transition-all" />
              </div>
              <button onClick={handleSelectAllRepos} className="px-4 py-2.5 text-sm text-electric-400 hover:text-electric-500 hover:bg-electric-400/10 rounded-xl transition-all">
                {selectedRepos.length === filteredRepos.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="text-sm text-frost-300/60 mb-2">{selectedRepos.length} of {filteredRepos.length} repositories selected</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filteredRepos.map(repo => {
                const isSelected = selectedRepos.some(r => r.name === repo.name)
                return (
                  <button key={repo.name} onClick={() => handleToggleRepo(repo)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-electric-400/10 border-electric-400/50' : 'bg-void-700/30 border-void-600/50 hover:border-frost-300/30'}`}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-electric-400 border-electric-400' : 'border-frost-300/30'}`}>
                      {isSelected && <Check className="w-3 h-3 text-void-900" />}
                    </div>
                    <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-electric-400' : 'text-yellow-400'}`} />
                    <span className={`text-sm truncate ${isSelected ? 'text-electric-400' : 'text-frost-200'}`}>{repo.name}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={handleConfirmRepos} disabled={selectedRepos.length === 0} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Continue with {selectedRepos.length} repo{selectedRepos.length !== 1 ? 's' : ''}<ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Branch Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-frost-300/60">{totalSelectedBranches} branches selected across {selectedRepos.length} repos</span>
              <button onClick={() => setStep(1)} className="text-sm text-frost-300/60 hover:text-frost-200 transition-colors">Change repos</button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" />
              <input type="text" value={branchSearch} onChange={(e) => setBranchSearch(e.target.value)} placeholder="Search branches..." className="w-full pl-10 pr-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 transition-all" />
            </div>
            {loadingBranches ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-electric-400 animate-spin" /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchPageRepos.map(repo => (
                    <RepoBranchCard key={repo.name} repo={repo} branches={branchesMap[repo.name] || []} selectedBranches={selectedBranchesMap[repo.name] || new Set()} onToggleBranch={(branchName) => handleToggleBranch(repo.name, branchName)} onSelectAll={() => handleSelectAllBranchesForRepo(repo.name)} branchSearch={branchSearch} />
                  ))}
                </div>
                <Pagination currentPage={branchPage} totalPages={branchTotalPages} onPageChange={setBranchPage} />
                <button onClick={handleConfirmBranches} disabled={totalSelectedBranches === 0} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">Continue<ArrowRight className="w-4 h-4" /></button>
              </>
            )}
          </div>
        )}

        {/* Step 3: File Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-frost-300/60">Select files/folders (optional)</span>
              <button onClick={() => setStep(2)} className="text-sm text-frost-300/60 hover:text-frost-200 transition-colors">Change branches</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ minHeight: '320px' }}>
              {filePageRepos.map(repo => (
                <RepoFileTreeCard key={repo.name} repo={repo} tree={treesMap[repo.name] || []} selectedPaths={selectedPathsMap[repo.name] || new Set()} onTogglePath={handleTogglePath(repo.name)} loading={loadingTrees[repo.name]} />
              ))}
            </div>
            <Pagination currentPage={filePage} totalPages={fileTotalPages} onPageChange={setFilePage} />
            <div className="flex gap-3">
              <button onClick={() => { const cleared = {}; selectedRepos.forEach(r => cleared[r.name] = new Set()); setSelectedPathsMap(cleared) }} className="flex-1 px-4 py-3 bg-void-700/50 hover:bg-void-700 border border-void-600/50 rounded-xl text-frost-300 font-medium transition-all">Clear All</button>
              <button onClick={handleProceedToSearch} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all">
                {totalSelectedPaths > 0 ? `Search in ${totalSelectedPaths} items` : 'Search All Files'}<ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Search */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 p-3 bg-void-700/30 rounded-xl text-sm">
              <span className="text-frost-300/60">Scope:</span>
              <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded font-medium">{selectedRepos.length} repos</span>
              <span className="px-2 py-1 bg-electric-400/20 text-electric-400 rounded">{totalSelectedBranches} branches</span>
              {totalSelectedPaths > 0 && <span className="px-2 py-1 bg-neon-pink/20 text-neon-pink rounded">{totalSelectedPaths} paths</span>}
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-frost-300/60 hover:text-frost-200 transition-colors">Modify</button>
            </div>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-frost-300/40" />
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for code..." className="w-full pl-12 pr-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-neon-pink/50 focus:ring-2 focus:ring-neon-pink/25 transition-all" autoFocus />
                </div>
                <button type="submit" disabled={loading || !query.trim()} className="px-6 py-3 bg-gradient-to-r from-neon-pink to-purple-500 hover:from-neon-pink/90 hover:to-purple-500/90 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}Search
                </button>
              </div>
              <div className="flex gap-3">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 text-sm focus:outline-none focus:border-electric-400/50 appearance-none cursor-pointer">
                  <option value="">Any language</option>
                  {LANGUAGES.map(lang => <option key={lang} value={lang.toLowerCase()}>{lang}</option>)}
                </select>
                <input type="text" value={extension} onChange={(e) => setExtension(e.target.value)} placeholder="Extension" className="px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-electric-400/50 w-32" />
              </div>
            </form>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Search failed</p>
            <p className="text-sm text-red-400/70 whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <h3 className="text-frost-200 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-pink" />{results.totalCount.toLocaleString()} results
          </h3>
          {results.items.length === 0 ? (
            <div className="text-center py-12 text-frost-300/60">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No code matches found</p>
              <p className="text-xs mt-2">Try a different search term or check the console for errors</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.items.map((result, index) => (
                <CodePreview key={`${result.repository?.fullName || 'unknown'}-${result.path}-${index}`} result={result} token={token} org={org} selectedBranches={result.searchedBranches || []} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
