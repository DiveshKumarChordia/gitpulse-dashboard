import { useState, useCallback, useEffect } from 'react'
import { 
  Search, FileCode, Folder, ExternalLink, Code2, Loader2, AlertCircle, 
  ChevronDown, ChevronUp, GitBranch, Check, X, FolderTree, ArrowRight,
  RotateCcw, Sparkles
} from 'lucide-react'
import { searchCode, getFileContent, fetchBranches, fetchRepoTree } from '../api/github'
import { FileTree } from './FileTree'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'Ruby', 'PHP', 
  'C', 'C++', 'C#', 'Swift', 'Kotlin', 'HTML', 'CSS', 'JSON', 'YAML', 'Markdown'
]

function CodePreview({ result, token, org, selectedBranch }) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)

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
        selectedBranch || 'main'
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
            <div className="min-w-0">
              <h3 className="text-frost-100 font-medium truncate">
                {result.name}
              </h3>
              <p className="text-xs text-frost-300/60 font-mono truncate mt-0.5">
                {result.path}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
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
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-void-600/50 rounded-lg transition-colors"
              title="Open on GitHub"
            >
              <ExternalLink className="w-4 h-4 text-frost-300/60 group-hover:text-electric-400" />
            </a>
          </div>
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
      <span className={`text-sm font-medium ${isActive ? 'text-frost-100' : ''}`}>{label}</span>
    </div>
  )
}

export function CodeSearch({ token, org, allRepos }) {
  // Current step: 1=repo, 2=branch, 3=files, 4=search
  const [step, setStep] = useState(1)
  
  // Selections
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [branches, setBranches] = useState([])
  const [selectedBranches, setSelectedBranches] = useState(new Set())
  const [repoTree, setRepoTree] = useState([])
  const [selectedPaths, setSelectedPaths] = useState(new Set())
  
  // Search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [loadingTree, setLoadingTree] = useState(false)
  const [error, setError] = useState(null)
  
  // Filters
  const [language, setLanguage] = useState('')
  const [extension, setExtension] = useState('')
  const [repoSearch, setRepoSearch] = useState('')

  // Filter repos by search
  const filteredRepos = allRepos.filter(repo => 
    repo.name.toLowerCase().includes(repoSearch.toLowerCase())
  )

  // Load branches when repo selected
  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo)
    setSelectedBranches(new Set())
    setBranches([])
    setRepoTree([])
    setSelectedPaths(new Set())
    setResults(null)
    setStep(2)
    
    setLoadingBranches(true)
    try {
      const branchList = await fetchBranches(token, org, repo.name)
      setBranches(branchList)
      // Auto-select default branch
      const defaultBranch = branchList.find(b => b.name === repo.defaultBranch) || branchList[0]
      if (defaultBranch) {
        setSelectedBranches(new Set([defaultBranch.name]))
      }
    } catch (e) {
      setError('Failed to load branches')
    } finally {
      setLoadingBranches(false)
    }
  }

  // Load tree when branches confirmed
  const handleConfirmBranches = async () => {
    if (selectedBranches.size === 0) return
    
    setStep(3)
    setLoadingTree(true)
    
    try {
      const branch = Array.from(selectedBranches)[0] // Use first selected branch for tree
      const tree = await fetchRepoTree(token, org, selectedRepo.name, branch)
      setRepoTree(tree)
    } catch (e) {
      console.error('Failed to load tree:', e)
      setRepoTree([])
    } finally {
      setLoadingTree(false)
    }
  }

  // Toggle branch selection
  const handleToggleBranch = (branchName) => {
    setSelectedBranches(prev => {
      const next = new Set(prev)
      if (next.has(branchName)) {
        next.delete(branchName)
      } else {
        next.add(branchName)
      }
      return next
    })
  }

  const handleSelectAllBranches = () => {
    if (selectedBranches.size === branches.length) {
      setSelectedBranches(new Set())
    } else {
      setSelectedBranches(new Set(branches.map(b => b.name)))
    }
  }

  // Toggle path selection
  const handleTogglePath = (path, isFolder, node) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)
      
      if (next.has(path)) {
        next.delete(path)
        // If folder, also remove all children
        if (isFolder && node.children) {
          const removeChildren = (n) => {
            next.delete(n.path)
            if (n.children) n.children.forEach(removeChildren)
          }
          node.children.forEach(removeChildren)
        }
      } else {
        next.add(path)
        // If folder, also add all children
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

  // Perform search
  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await searchCode(token, query, org, selectedRepo?.name, {
        branches: Array.from(selectedBranches),
        paths: Array.from(selectedPaths).filter(p => !p.includes('/')).length > 0 
          ? Array.from(selectedPaths) 
          : [],
        language: language || undefined,
        extension: extension || undefined,
      })
      setResults(searchResults)
    } catch (err) {
      setError(err.message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  // Reset all
  const handleReset = () => {
    setStep(1)
    setSelectedRepo(null)
    setBranches([])
    setSelectedBranches(new Set())
    setRepoTree([])
    setSelectedPaths(new Set())
    setQuery('')
    setResults(null)
    setError(null)
    setLanguage('')
    setExtension('')
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
                Search across repositories like your IDE
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
          <StepIndicator step={1} currentStep={step} label="Repository" icon={Folder} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={2} currentStep={step} label="Branches" icon={GitBranch} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={3} currentStep={step} label="Files (optional)" icon={FolderTree} />
          <ArrowRight className="w-4 h-4 text-frost-300/20" />
          <StepIndicator step={4} currentStep={step} label="Search" icon={Search} />
        </div>

        {/* Step 1: Repository Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <input
              type="text"
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              placeholder="Search repositories..."
              className="w-full px-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 transition-all"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {filteredRepos.map(repo => (
                <button
                  key={repo.name}
                  onClick={() => handleSelectRepo(repo)}
                  className="flex items-start gap-3 p-4 bg-void-700/30 hover:bg-void-700/50 border border-void-600/50 hover:border-electric-400/30 rounded-xl transition-all text-left group"
                >
                  <Folder className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="font-medium text-frost-100 truncate group-hover:text-electric-400 transition-colors">
                      {repo.name}
                    </h3>
                    {repo.description && (
                      <p className="text-xs text-frost-300/60 truncate mt-1">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-void-600/50 rounded text-frost-300/60">
                        {repo.defaultBranch}
                      </span>
                      {repo.private && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                          Private
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Branch Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-yellow-400" />
                <span className="font-medium text-frost-100">{selectedRepo?.name}</span>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-frost-300/60 hover:text-frost-200 transition-colors"
              >
                Change repo
              </button>
            </div>

            {loadingBranches ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-electric-400 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-frost-300/60">
                    Select branches ({selectedBranches.size} of {branches.length})
                  </span>
                  <button
                    onClick={handleSelectAllBranches}
                    className="text-sm text-electric-400 hover:text-electric-500 transition-colors"
                  >
                    {selectedBranches.size === branches.length ? 'Clear all' : 'Select all'}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {branches.map(branch => (
                    <button
                      key={branch.name}
                      onClick={() => handleToggleBranch(branch.name)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                        selectedBranches.has(branch.name)
                          ? 'bg-electric-400/10 border-electric-400/50 text-electric-400'
                          : 'bg-void-700/30 border-void-600/50 text-frost-300/60 hover:border-frost-300/30'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedBranches.has(branch.name) ? 'bg-electric-400 border-electric-400' : 'border-current'
                      }`}>
                        {selectedBranches.has(branch.name) && <Check className="w-3 h-3 text-void-900" />}
                      </div>
                      <GitBranch className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{branch.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleConfirmBranches}
                  disabled={selectedBranches.size === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3: File Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium text-frost-100">{selectedRepo?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-electric-400" />
                  <span className="text-sm text-electric-400">
                    {selectedBranches.size} branch{selectedBranches.size !== 1 ? 'es' : ''}
                  </span>
                </div>
              </div>
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
            <div className="flex flex-wrap items-center gap-2 p-3 bg-void-700/30 rounded-xl">
              <span className="text-sm text-frost-300/60">Searching in:</span>
              <span className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded text-sm font-medium">
                {selectedRepo?.name}
              </span>
              <span className="px-2 py-1 bg-electric-400/20 text-electric-400 rounded text-sm">
                {selectedBranches.size} branch{selectedBranches.size !== 1 ? 'es' : ''}
              </span>
              {selectedPaths.size > 0 && (
                <span className="px-2 py-1 bg-neon-pink/20 text-neon-pink rounded text-sm">
                  {selectedPaths.size} path{selectedPaths.size !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={() => setStep(3)}
                className="ml-auto text-xs text-frost-300/60 hover:text-frost-200 transition-colors"
              >
                Modify scope
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

              {/* Additional filters */}
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
              {results.totalCount.toLocaleString()} results found
              {results.incompleteResults && (
                <span className="text-xs text-frost-300/60">(may be incomplete)</span>
              )}
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
                  selectedBranch={Array.from(selectedBranches)[0]}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
