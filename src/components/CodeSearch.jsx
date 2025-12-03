import { useState, useCallback } from 'react'
import { Search, FileCode, Folder, ExternalLink, Code2, Filter, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { searchCode, getFileContent } from '../api/github'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'Ruby', 'PHP', 
  'C', 'C++', 'C#', 'Swift', 'Kotlin', 'Scala', 'HTML', 'CSS', 'SCSS', 
  'JSON', 'YAML', 'Markdown', 'SQL', 'Shell', 'Dockerfile'
]

function CodePreview({ result, token, org }) {
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
      const fileContent = await getFileContent(token, org, result.repository.name, result.path)
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
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 bg-electric-400/10 rounded-lg flex-shrink-0">
              <FileCode className="w-4 h-4 text-electric-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 bg-void-600/50 text-electric-400 rounded font-mono">
                  {result.repository.name}
                </span>
                {result.repository.private && (
                  <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                    Private
                  </span>
                )}
              </div>
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

        {/* Text matches / snippets */}
        {result.textMatches && result.textMatches.length > 0 && (
          <div className="mt-3 space-y-2">
            {result.textMatches.slice(0, 2).map((match, i) => (
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

      {/* Expanded content */}
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

  // Simple highlight - just show the fragment with basic styling
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

export function CodeSearch({ token, org, allRepos }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filters
  const [selectedRepos, setSelectedRepos] = useState([])
  const [language, setLanguage] = useState('')
  const [path, setPath] = useState('')
  const [extension, setExtension] = useState('')

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault()
    
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await searchCode(token, query, org, selectedRepos, {
        language: language || undefined,
        path: path || undefined,
        extension: extension || undefined,
      })
      setResults(searchResults)
    } catch (err) {
      setError(err.message)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [token, org, query, selectedRepos, language, path, extension])

  const clearFilters = () => {
    setSelectedRepos([])
    setLanguage('')
    setPath('')
    setExtension('')
  }

  const hasFilters = selectedRepos.length > 0 || language || path || extension

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-neon-pink to-purple-500 rounded-xl">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-frost-100">
              Code Search
            </h2>
            <p className="text-sm text-frost-300/60">
              Search for code across all repositories like your IDE
            </p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-frost-300/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for code, functions, classes, variables..."
                className="w-full pl-12 pr-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-electric-400/50 focus:ring-2 focus:ring-electric-400/25 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-gradient-to-r from-neon-pink to-purple-500 hover:from-neon-pink/90 hover:to-purple-500/90 rounded-xl text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Search
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-frost-300/60 hover:text-frost-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide filters' : 'Show filters'}
            {hasFilters && (
              <span className="px-1.5 py-0.5 bg-neon-pink/20 text-neon-pink rounded text-xs">
                Active
              </span>
            )}
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-void-600/30">
              {/* Language */}
              <div className="space-y-2">
                <label className="text-xs text-frost-300/60">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 text-sm focus:outline-none focus:border-electric-400/50 appearance-none cursor-pointer"
                >
                  <option value="">Any language</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Path */}
              <div className="space-y-2">
                <label className="text-xs text-frost-300/60">Path contains</label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="e.g. src/components"
                  className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-electric-400/50"
                />
              </div>

              {/* Extension */}
              <div className="space-y-2">
                <label className="text-xs text-frost-300/60">File extension</label>
                <input
                  type="text"
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                  placeholder="e.g. tsx, py, go"
                  className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-electric-400/50"
                />
              </div>

              {/* Repository filter */}
              <div className="space-y-2">
                <label className="text-xs text-frost-300/60">
                  Repositories ({selectedRepos.length} selected)
                </label>
                <select
                  multiple
                  value={selectedRepos}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, opt => opt.value)
                    setSelectedRepos(values)
                  }}
                  className="w-full px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 text-sm focus:outline-none focus:border-electric-400/50 h-20"
                >
                  {allRepos.map(repo => (
                    <option key={repo.name} value={repo.name}>
                      {repo.name}
                    </option>
                  ))}
                </select>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-frost-300/60 hover:text-frost-200 transition-colors col-span-full"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </form>
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
            <h3 className="text-frost-200 font-medium">
              {results.totalCount.toLocaleString()} results found
              {results.incompleteResults && (
                <span className="text-xs text-frost-300/60 ml-2">(results may be incomplete)</span>
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
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && !error && (
        <div className="text-center py-16 text-frost-300/60">
          <Code2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-frost-200 mb-2">Search your organization's code</p>
          <p className="text-sm max-w-md mx-auto">
            Find functions, classes, variables, or any text across all your repositories.
            Just like searching in your IDE, but across your entire org.
          </p>
        </div>
      )}
    </div>
  )
}

