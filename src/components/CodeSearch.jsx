import { useState, useCallback } from 'react'
import { 
  Search, FileCode, Folder, ExternalLink, Code2, Loader2, AlertCircle, 
  ChevronDown, ChevronUp, GitBranch, Check, X, FolderTree, ArrowRight,
  RotateCcw, Sparkles, GitCommit, Link
} from 'lucide-react'
import { searchCode, getFileContent, fetchBranches, fetchRepoTree } from '../api/github'
import { FileTree } from './FileTree'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'Ruby', 'PHP', 
  'C', 'C++', 'C#', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JSON', 'YAML', 'Markdown'
]

function CodePreview({ result, token, org, selectedBranches }) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)

  const branch = selectedBranches?.length > 0 ? selectedBranches[0] : 'main'
  const branchUrl = `https://github.com/${org}/${result.repository.name}/tree/${branch}`
  const fileUrlWithBranch = `https://github.com/${org}/${result.repository.name}/blob/${branch}/${result.path}`

  const loadContent = async () => {
    if (content) {
      setExpanded(!expanded)
      return
    }
    
    setLoading(true)
    try {
      const fileContent = await getFileContent(
        token, 
        org, 
        result.repository.name, 
        result.path,
        branch
      )
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
                  {result.repository.name}
                </span>
                <span className="text-xs px-2 py-0.5 bg-electric-400/20 text-electric-400 rounded flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {branch}
                </span>
              </div>
              <h3 className="text-frost-100 font-medium truncate">
                {result.name}
              </h3>
              <p className="text-xs text-frost-300/60 font-mono truncate mt-0.5">
                {result.path}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={branchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-void-600/50 rounded-lg transition-colors"
              title="Open branch on GitHub"
            >
              <GitBranch className="w-4 h-4 text-frost-300/60 hover:text-electric-400" />
            </a>
            <button
              onClick={loadContent}
              disabled={loading}
              className="p-2 hover:bg-void-600/50 rounded-lg transition-colors"
              title="Preview file"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 text-frost-300/60 animate-spin" />
              ) : expanded ? (
                <ChevronUp className="w-4 h-4 text-frost-300/60" />
              ) : (
                <ChevronDown className="w-4 h-4 text-frost-300/60" />
              )}
            </button>
            <a
              href={fileUrlWithBranch}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-void-600/50 rounded-lg transition-colors"
              title="Open file on GitHub"
            >
              <ExternalLink className="w-4 h-4 text-frost-300/60 group-hover:text-electric-400" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-void-600/30">
          <a
            href={fileUrlWithBranch}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-electric-400 hover:text-electric-500 transition-colors"
          >
            <Link className="w-3 h-3" />
            View in {branch}
          </a>
          <a
            href={branchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors"
          >
            <GitBranch className="w-3 h-3" />
            Browse branch
          </a>
          <a
            href={`https://github.com/${org}/${result.repository.name}/commits/${branch}/${result.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-frost-300/60 hover:text-frost-200 transition-colors"
          >
            <GitCommit className="w-3 h-3" />
            View commits
          </a>
        </div>

        {result.textMatches && result.textMatches.length > 0 && (
          <div className="mt-3 space-y-2">
            {result.textMatches.slice(0, 3).map((match, i) => (
              <div 
                key={i}
                className="bg-void-900/50 rounded-lg p-3 font-mono text-xs overflow-x-auto"
              >
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
  if (!matches || matches.length === 0) {
    return <span className="text-frost-300/70">{fragment}</span>
  }

  const parts = []
  let lastIndex = 0
  
  for (const match of matches) {
    if (match.indices && match.indices.length >= 2) {
      const [start, end] = match.indices
      if (start > lastIndex) {
        parts.push(
          <span key={`pre-${start}`} className="text-frost-300/70">
            {fragment.slice(lastIndex, start)}
          </span>
        )
      }
      parts.push(
        <span key={`match-${start}`} className="bg-yellow-400/30 text-yellow-200 px-0.5 rounded">
          {fragment.slice(start, end)}
        </span>
      )
      lastIndex = end
    }
  }
  
  if (lastIndex < fragment.length) {
    parts.push(
      <span key="post" className="text-frost-300/70">
        {fragment.slice(lastIndex)}
      </span>
    )
  }

  return <>{parts.length > 0 ? parts : <span className="text-frost-300/70">{fragment}</span>}</>
}

function StepIndicator({ step, currentStep, label, icon: Icon }) {
  const isActive = currentStep === step
  const isComplete = currentStep > step
  
  return (
    <div className={`flex items-center gap-2 ${isActive ? 'text-electric-400' : isComplete ? 'text-neon-green' : 'text-frost-300/40'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
        isActive ? 'border-electric-400 bg-electric-400/10' : 
        isComplete ? 'border-neon-green bg-neon-green/10' : 
        'border-frost-300/20'
      }`}>
        {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      </div>
      <span className={`text-sm font-medium hidden md:block ${isActive ? 'text-frost-100' : ''}`}>{label}</span>
    </div>
  )
}

export function CodeSearch({ token, org, allRepos }) {
  const [step, setStep] = useState(1)
  
  // Multi-select repos
  const [selectedRepos, setSelectedRepos] = useState([])
  const [repoSearch, setRepoSearch] = useState('')
  
  // Branches per repo
  const [branchesMap, setBranchesMap] = useState({}) // { repoName: branches[] }
  const [selectedBranchesMap, setSelectedBranchesMap] = useState({}) // { repoName: Set<branchName> }
  const [branchSearch, setBranchSearch] = useState('')
  const [loadingBranches, setLoadingBranches] = useState(false)
  
  // File tree (for first selected repo)
  const [repoTree, setRepoTree] = useState([])
  const [selectedPaths, setSelectedPaths] = useState(new Set())
  const [loadingTree, setLoadingTree] = useState(false)
  
  // Search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [language, setLanguage] = useState('')
  const [extension, setExtension] = useState('')

  // Filter repos
  const filteredRepos = allRepos.filter(repo => 
    repo.name.toLowerCase().includes(repoSearch.toLowerCase())
  )

  // Toggle repo selection
  const handleToggleRepo = (repo) => {
    setSelectedRepos(prev => {
      const exists = prev.find(r => r.name === repo.name)
      if (exists) {
        return prev.filter(r => r.name !== repo.name)
      }
      return [...prev, repo]
    })
  }

  const handleSelectAllRepos = () => {
    if (selectedRepos.length === filteredRepos.length) {
      setSelectedRepos([])
    } else {
      setSelectedRepos([...filteredRepos])
    }
  }

  // Load branches for selected repos
  const handleConfirmRepos = async () => {
    if (selectedRepos.length === 0) return
    
    setStep(2)
    setLoadingBranches(true)
    
    const newBranchesMap = {}
    const newSelectedBranchesMap = {}
    
    for (const repo of selectedRepos) {
      try {
        const branches = await fetchBranches(token, org, repo.name)
        newBranchesMap[repo.name] = branches
        // Auto-select default branch
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

  // Toggle branch for a repo
  const handleToggleBranch = (repoName, branchName) => {
    setSelectedBranchesMap(prev => {
      const repoSet = new Set(prev[repoName] || [])
      if (repoSet.has(branchName)) {
        repoSet.delete(branchName)
      } else {
        repoSet.add(branchName)
      }
      return { ...prev, [repoName]: repoSet }
    })
  }

  const handleSelectAllBranchesForRepo = (repoName) => {
    const branches = branchesMap[repoName] || []
    const currentSelected = selectedBranchesMap[repoName] || new Set()
    
    if (currentSelected.size === branches.length) {
      setSelectedBranchesMap(prev => ({ ...prev, [repoName]: new Set() }))
    } else {
      setSelectedBranchesMap(prev => ({ 
        ...prev, 
        [repoName]: new Set(branches.map(b => b.name)) 
      }))
    }
  }

  // Get total selected branches
  const totalSelectedBranches = Object.values(selectedBranchesMap).reduce(
    (sum, set) => sum + set.size, 0
  )

  // Filter branches by search
  const getFilteredBranches = (repoName) => {
    const branches = branchesMap[repoName] || []
    if (!branchSearch) return branches
    return branches.filter(b => 
      b.name.toLowerCase().includes(branchSearch.toLowerCase())
    )
  }

  // Load file tree
  const handleConfirmBranches = async () => {
    if (totalSelectedBranches === 0) return
    
    setStep(3)
    setLoadingTree(true)
    
    // Load tree for first repo's first selected branch
    const firstRepo = selectedRepos[0]
    const firstBranch = Array.from(selectedBranchesMap[firstRepo.name] || [])[0]
    
    if (firstRepo && firstBranch) {
      try {
        const tree = await fetchRepoTree(token, org, firstRepo.name, firstBranch)
        setRepoTree(tree)
      } catch (e) {
        setRepoTree([])
      }
    }
    
    setLoadingTree(false)
  }

  // Toggle path selection
  const handleTogglePath = (path, isFolder, node) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)
      
      if (next.has(path)) {
        next.delete(path)
        if (isFolder && node.children) {
          const removeChildren = (n) => {
            next.delete(n.path)
            if (n.children) n.children.forEach(removeChildren)
          }
          node.children.forEach(removeChildren)
        }
      } else {
        next.add(path)
        if (isFolder && node.children) {
          const addChildren = (n) => {
            next.add(n.path)
            if (n.children) n.children.forEach(addChildren)
          }
          node.children.forEach(addChildren)
        }
      }
      
      return next
    })
  }

  // Proceed to search
  const handleProceedToSearch = () => {
    setStep(4)
  }

  // Build search scope summary
  const getSearchScope = () => {
    const repos = selectedRepos.map(r => r.name)
    const branches = []
    for (const [repo, branchSet] of Object.entries(selectedBranchesMap)) {
      for (const branch of branchSet) {
        branches.push(`${repo}:${branch}`)
      }
    }
    return { repos, branches, paths: Array.from(selectedPaths) }
  }

  // Perform search
  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Search across all selected repos
      const allResults = []
      
      for (const repo of selectedRepos) {
        const repoBranches = Array.from(selectedBranchesMap[repo.name] || [])
        
        // GitHub Search API searches default branch, but we'll include branch context
        const searchResults = await searchCode(token, query, org, repo.name, {
          branches: repoBranches,
          paths: Array.from(selectedPaths),
          language: language || undefined,
          extension: extension || undefined,
        })
        
        // Add branch info to results
        searchResults.items.forEach(item => {
          item.searchedBranches = repoBranches
        })
        
        allResults.push(...searchResults.items)
      }
      
      setResults({
        totalCount: allResults.length,
        items: allResults,
        incompleteResults: false,
      })
    } catch (err) {
      setError(err.message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  // Reset
  const handleReset = () => {
    setStep(1)
    setSelectedRepos([])
    setBranchesMap({})
    setSelectedBranchesMap({})
    setRepoTree([])
    setSelectedPaths(new Set())
    setQuery('')
    setResults(null)
    setError(null)
    setLanguage('')
    setExtension('')
    setRepoSearch('')
    setBranchSearch('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-neon-pink to-purple-500 rounded-xl">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-frost-100">
                Code Search
              </h2>
              <p className="text-sm text-frost-300/60">
                Multi-repo, multi-branch search
              </p>
            </div>
          </div>
          
          {step > 1 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50 rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <StepIndicator step={1} currentStep={step} label="Repositories" icon={Folder} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={2} currentStep={step} label="Branches" icon={GitBranch} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={3} currentStep={step} label="Files" icon={FolderTree} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={4} currentStep={step} label="Search" icon={Search} />
        </div>

        {/* Step 1: Repository Selection (Multi) */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full pl-10 pr-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 transition-all"
                />
              </div>
              <button
                onClick={handleSelectAllRepos}
                className="px-4 py-2.5 text-sm text-electric-400 hover:text-electric-500 hover:bg-electric-400/10 rounded-xl transition-all"
              >
                {selectedRepos.length === filteredRepos.length ? 'Clear all' : 'Select all'}
              </button>
            </div>

            <div className="text-sm text-frost-300/60 mb-2">
              {selectedRepos.length} of {filteredRepos.length} repositories selected
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filteredRepos.map(repo => {
                const isSelected = selectedRepos.some(r => r.name === repo.name)
                return (
                  <button
                    key={repo.name}
                    onClick={() => handleToggleRepo(repo)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'bg-electric-400/10 border-electric-400/50'
                        : 'bg-void-700/30 border-void-600/50 hover:border-frost-300/30'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-electric-400 border-electric-400' : 'border-frost-300/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-void-900" />}
                    </div>
                    <Folder className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-electric-400' : 'text-yellow-400'}`} />
                    <span className={`text-sm truncate ${isSelected ? 'text-electric-400' : 'text-frost-200'}`}>
                      {repo.name}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={handleConfirmRepos}
              disabled={selectedRepos.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with {selectedRepos.length} repo{selectedRepos.length !== 1 ? 's' : ''}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Branch Selection (Multi per repo) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-frost-300/60">
                {totalSelectedBranches} branches selected across {selectedRepos.length} repos
              </span>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-frost-300/60 hover:text-frost-200 transition-colors"
              >
                Change repos
              </button>
            </div>

            {/* Branch search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" />
              <input
                type="text"
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branches..."
                className="w-full pl-10 pr-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 transition-all"
              />
            </div>

            {loadingBranches ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-electric-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {selectedRepos.map(repo => {
                  const branches = getFilteredBranches(repo.name)
                  const selected = selectedBranchesMap[repo.name] || new Set()
                  
                  return (
                    <div key={repo.name} className="bg-void-700/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-yellow-400" />
                          <span className="font-medium text-frost-100">{repo.name}</span>
                          <span className="text-xs text-frost-300/60">
                            ({selected.size}/{branches.length})
                          </span>
                        </div>
                        <button
                          onClick={() => handleSelectAllBranchesForRepo(repo.name)}
                          className="text-xs text-electric-400 hover:text-electric-500 transition-colors"
                        >
                          {selected.size === branches.length ? 'Clear' : 'Select all'}
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {branches.map(branch => (
                          <button
                            key={branch.name}
                            onClick={() => handleToggleBranch(repo.name, branch.name)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                              selected.has(branch.name)
                                ? 'bg-electric-400/20 text-electric-400 border border-electric-400/30'
                                : 'bg-void-600/50 text-frost-300/60 border border-void-600/50 hover:border-frost-300/30'
                            }`}
                          >
                            <GitBranch className="w-3 h-3" />
                            {branch.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={handleConfirmBranches}
              disabled={totalSelectedBranches === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: File Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-frost-300/60">
                Select files/folders to narrow search (optional)
              </span>
              <button
                onClick={() => setStep(2)}
                className="text-sm text-frost-300/60 hover:text-frost-200 transition-colors"
              >
                Change branches
              </button>
            </div>

            {loadingTree ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-electric-400 animate-spin" />
              </div>
            ) : (
              <>
                {selectedRepos.length > 1 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400">
                    File tree shown for: {selectedRepos[0].name}. Path filters will apply to all repos.
                  </div>
                )}
                
                <FileTree
                  tree={repoTree}
                  selectedPaths={selectedPaths}
                  onSelect={handleTogglePath}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedPaths(new Set())}
                    className="flex-1 px-4 py-3 bg-void-700/50 hover:bg-void-700 border border-void-600/50 rounded-xl text-frost-300 font-medium transition-all"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleProceedToSearch}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all"
                  >
                    {selectedPaths.size > 0 ? `Search in ${selectedPaths.size} items` : 'Search All Files'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Search */}
        {step === 4 && (
          <div className="space-y-4">
            {/* Context summary */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-void-700/30 rounded-xl text-sm">
              <span className="text-frost-300/60">Scope:</span>
              <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded font-medium">
                {selectedRepos.length} repo{selectedRepos.length !== 1 ? 's' : ''}
              </span>
              <span className="px-2 py-1 bg-electric-400/20 text-electric-400 rounded">
                {totalSelectedBranches} branch{totalSelectedBranches !== 1 ? 'es' : ''}
              </span>
              {selectedPaths.size > 0 && (
                <span className="px-2 py-1 bg-neon-pink/20 text-neon-pink rounded">
                  {selectedPaths.size} path{selectedPaths.size !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={() => setStep(1)}
                className="ml-auto text-xs text-frost-300/60 hover:text-frost-200 transition-colors"
              >
                Modify
              </button>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-frost-300/40" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for code, functions, classes..."
                    className="w-full pl-12 pr-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-neon-pink/50 focus:ring-2 focus:ring-neon-pink/25 transition-all"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-neon-pink to-purple-500 hover:from-neon-pink/90 hover:to-purple-500/90 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Search
                </button>
              </div>

              <div className="flex gap-3">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 text-sm focus:outline-none focus:border-electric-400/50 appearance-none cursor-pointer"
                >
                  <option value="">Any language</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                  placeholder="Extension (e.g., tsx)"
                  className="px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-electric-400/50 w-40"
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Search failed</p>
            <p className="text-sm text-red-400/70">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-frost-200 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-pink" />
              {results.totalCount.toLocaleString()} results
            </h3>
          </div>

          {results.items.length === 0 ? (
            <div className="text-center py-12 text-frost-300/60">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No code matches found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.items.map((result, index) => (
                <CodePreview 
                  key={`${result.repository.fullName}-${result.path}-${index}`}
                  result={result}
                  token={token}
                  org={org}
                  selectedBranches={result.searchedBranches || []}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
