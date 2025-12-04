import { useState, useEffect } from 'react'
import { 
  Search, FileCode, Folder, ExternalLink, Code2, Loader2, 
  GitBranch, Check, ArrowRight, RotateCcw, Sparkles, GitCommit, 
  ChevronLeft, ChevronRight as ChevronRightIcon, History, Clock,
  GitPullRequest, GitMerge, User, Calendar, FileText, ChevronDown, 
  ChevronUp, Diff, Eye, AlertTriangle, Network, Trash2, Plus,
  Layers, Globe, FolderTree, File, AlertCircle, Info
} from 'lucide-react'
import { fetchBranches, fetchRepoTree, getFileContent } from '../api/github'
import { FileTree } from './FileTree'
import { useToast } from './Toast'

const GITHUB_API_BASE = 'https://api.github.com'

// ============ API FUNCTIONS ============

// Fetch all commits for a file
async function fetchFileCommits(token, owner, repo, path, branch = 'main') {
  const commits = []
  let page = 1
  
  while (page <= 10) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}&per_page=100&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitPulse-Dashboard',
          },
        }
      )
      
      if (!response.ok) {
        if (response.status === 403) throw new Error('Rate limit exceeded')
        break
      }
      
      const data = await response.json()
      commits.push(...data)
      
      if (data.length < 100) break
      page++
    } catch (e) {
      throw e
    }
  }
  
  return commits
}

// Fetch file content at specific commit
async function fetchFileAtCommit(token, owner, repo, path, commitSha) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${commitSha}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'GitPulse-Dashboard',
        },
      }
    )
    
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch file')
    }
    
    return await response.text()
  } catch (e) {
    return null
  }
}

// Fetch all commits in repo (for excavation) - with file details
async function fetchAllRepoCommits(token, owner, repo, branch, onProgress, maxPages = 20) {
  const commits = []
  let page = 1
  
  while (page <= maxPages) {
    try {
      onProgress?.({ page, status: `Loading commits (page ${page})...` })
      
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=100&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitPulse-Dashboard',
          },
        }
      )
      
      if (!response.ok) {
        if (response.status === 403) throw new Error('Rate limit exceeded')
        break
      }
      
      const data = await response.json()
      commits.push(...data)
      
      onProgress?.({ page, total: commits.length, status: `Loaded ${commits.length} commits` })
      
      if (data.length < 100) break
      page++
    } catch (e) {
      throw e
    }
  }
  
  return commits
}

// Fetch commit details with files changed
async function fetchCommitDetails(token, owner, repo, commitSha) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${commitSha}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitPulse-Dashboard',
        },
      }
    )
    
    if (!response.ok) return null
    return await response.json()
  } catch (e) {
    return null
  }
}

// Search through all commits for a term - BRANCH LEVEL
async function searchInBranch(token, owner, repo, query, branch, onProgress) {
  const commits = await fetchAllRepoCommits(token, owner, repo, branch, onProgress)
  
  const results = {
    commitMessages: [],
    filesModified: new Map(), // Map of filename -> array of commits
  }
  
  const lowerQuery = query.toLowerCase()
  
  // First pass: search commit messages
  onProgress?.({ status: 'Searching commit messages...' })
  for (const commit of commits) {
    if (commit.commit.message.toLowerCase().includes(lowerQuery)) {
      results.commitMessages.push({
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0],
        fullMessage: commit.commit.message,
        date: commit.commit.committer.date,
        author: commit.author?.login || commit.commit.author.name,
        avatarUrl: commit.author?.avatar_url,
        url: commit.html_url,
        branch,
      })
    }
  }
  
  // Second pass: get file details for matching commits (up to 50 for speed)
  const commitsToCheck = results.commitMessages.slice(0, 50)
  onProgress?.({ status: `Getting file details for ${commitsToCheck.length} commits...` })
  
  for (let i = 0; i < commitsToCheck.length; i++) {
    const commit = commitsToCheck[i]
    onProgress?.({ status: `Checking commit ${i + 1}/${commitsToCheck.length}...` })
    
    const details = await fetchCommitDetails(token, owner, repo, commit.sha)
    if (details?.files) {
      commit.files = details.files.map(f => ({
        filename: f.filename,
        status: f.status, // added, modified, removed
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
      }))
      
      // Track files modified
      for (const file of details.files) {
        if (!results.filesModified.has(file.filename)) {
          results.filesModified.set(file.filename, [])
        }
        results.filesModified.get(file.filename).push({
          ...commit,
          fileStatus: file.status,
          additions: file.additions,
          deletions: file.deletions,
        })
      }
    }
  }
  
  return results
}

// Search across ALL branches - REPO LEVEL
async function searchAcrossAllBranches(token, owner, repo, query, branches, onProgress) {
  const allResults = {
    commitMessages: [],
    filesModified: new Map(),
    branchesSearched: [],
  }
  
  const seenCommits = new Set() // Dedupe across branches
  
  for (let i = 0; i < branches.length; i++) {
    const branch = branches[i]
    onProgress?.({ 
      status: `Searching branch: ${branch.name} (${i + 1}/${branches.length})...`,
      branchProgress: { current: i + 1, total: branches.length }
    })
    
    try {
      const branchResults = await searchInBranch(
        token, owner, repo, query, branch.name,
        (p) => onProgress?.({ ...p, currentBranch: branch.name })
      )
      
      allResults.branchesSearched.push(branch.name)
      
      // Merge results (dedupe by commit sha)
      for (const commit of branchResults.commitMessages) {
        if (!seenCommits.has(commit.sha)) {
          seenCommits.add(commit.sha)
          allResults.commitMessages.push(commit)
        }
      }
      
      // Merge file results
      for (const [filename, commits] of branchResults.filesModified) {
        if (!allResults.filesModified.has(filename)) {
          allResults.filesModified.set(filename, [])
        }
        for (const commit of commits) {
          if (!seenCommits.has(`${commit.sha}-${filename}`)) {
            seenCommits.add(`${commit.sha}-${filename}`)
            allResults.filesModified.get(filename).push(commit)
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to search branch ${branch.name}:`, e)
    }
  }
  
  // Sort by date
  allResults.commitMessages.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  return allResults
}

// Fetch PRs associated with commits
async function fetchPRsForCommits(token, owner, repo, commitShas) {
  const prs = new Map()
  
  for (const sha of commitShas.slice(0, 10)) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}/pulls`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitPulse-Dashboard',
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        for (const pr of data) {
          if (!prs.has(pr.number)) {
            prs.set(pr.number, {
              number: pr.number,
              title: pr.title,
              state: pr.merged_at ? 'merged' : pr.state,
              url: pr.html_url,
              author: pr.user.login,
              date: pr.created_at,
            })
          }
        }
      }
    } catch (e) { /* continue */ }
  }
  
  return Array.from(prs.values())
}

// ============ COMPONENTS ============

function CommitCard({ commit, org, repo, showBranch = false, showFiles = false }) {
  const [expanded, setExpanded] = useState(false)
  const commitUrl = commit.url || `https://github.com/${org}/${repo}/commit/${commit.sha}`
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4 hover:border-frost-300/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-neon-green/10 rounded-lg flex-shrink-0">
          <GitCommit className="w-4 h-4 text-neon-green" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-electric-400 hover:text-electric-500 transition-colors">
              {commit.shortSha}
            </a>
            <span className="text-xs text-frost-300/40">•</span>
            <span className="text-xs text-frost-300/60">{new Date(commit.date).toLocaleDateString()}</span>
            {showBranch && commit.branch && (
              <>
                <span className="text-xs text-frost-300/40">•</span>
                <span className="text-xs px-2 py-0.5 bg-teal-400/15 text-teal-400 rounded flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />{commit.branch}
                </span>
              </>
            )}
          </div>
          <p className="text-frost-100 text-sm">{commit.message}</p>
          <div className="flex items-center gap-2 mt-2">
            {commit.avatarUrl && (
              <img src={commit.avatarUrl} alt={commit.author} className="w-4 h-4 rounded-full" />
            )}
            <span className="text-xs text-frost-300/60">{commit.author}</span>
          </div>
          
          {/* Files Changed */}
          {showFiles && commit.files && commit.files.length > 0 && (
            <div className="mt-3">
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-electric-400 hover:text-electric-500 flex items-center gap-1"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {commit.files.length} files changed
              </button>
              {expanded && (
                <div className="mt-2 space-y-1 pl-2 border-l-2 border-void-600/50">
                  {commit.files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        file.status === 'added' ? 'bg-green-500/20 text-green-400' :
                        file.status === 'removed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {file.status === 'added' ? '+' : file.status === 'removed' ? '−' : '~'}
                      </span>
                      <span className="text-frost-300/70 font-mono truncate">{file.filename}</span>
                      {file.additions > 0 && <span className="text-green-400">+{file.additions}</span>}
                      {file.deletions > 0 && <span className="text-red-400">-{file.deletions}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <a 
          href={commitUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 hover:bg-void-600/50 rounded-lg transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-4 h-4 text-frost-300/60 hover:text-neon-green" />
        </a>
      </div>
    </div>
  )
}

function FileVersionCard({ commit, org, repo, filePath, onViewContent, viewingCommit }) {
  const commitUrl = `https://github.com/${org}/${repo}/commit/${commit.sha}`
  const fileUrl = `https://github.com/${org}/${repo}/blob/${commit.sha}/${filePath}`
  const isViewing = viewingCommit === commit.sha
  
  return (
    <div className={`bg-void-700/30 border rounded-xl p-4 transition-all ${isViewing ? 'border-electric-400/50' : 'border-void-600/50 hover:border-frost-300/30'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${isViewing ? 'bg-electric-400/20' : 'bg-neon-green/10'}`}>
          <Clock className={`w-4 h-4 ${isViewing ? 'text-electric-400' : 'text-neon-green'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-frost-300/50 hover:text-electric-400 transition-colors">
              {commit.shortSha}
            </a>
            <span className="text-xs text-frost-300/60">{new Date(commit.date).toLocaleDateString()}</span>
          </div>
          <p className="text-frost-100 text-sm line-clamp-1">{commit.message}</p>
          <span className="text-xs text-frost-300/60 mt-1 block">{commit.author}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onViewContent(commit.sha)}
            className={`p-2 rounded-lg transition-colors ${isViewing ? 'bg-electric-400 text-void-900' : 'hover:bg-void-600/50'}`}
            title="View file at this commit"
          >
            <Eye className={`w-4 h-4 ${isViewing ? '' : 'text-frost-300/60'}`} />
          </button>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-void-600/50 rounded-lg transition-colors" title="View on GitHub">
            <ExternalLink className="w-4 h-4 text-frost-300/60 hover:text-electric-400" />
          </a>
        </div>
      </div>
    </div>
  )
}

function FileCard({ filename, commits, org, repo }) {
  const [expanded, setExpanded] = useState(false)
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-void-700/50 transition-colors"
      >
        <File className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        <span className="text-sm text-frost-200 font-mono truncate flex-1 text-left">{filename}</span>
        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">{commits.length} changes</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-frost-300/40" /> : <ChevronDown className="w-4 h-4 text-frost-300/40" />}
      </button>
      {expanded && (
        <div className="border-t border-void-600/30 p-3 space-y-2 max-h-64 overflow-y-auto">
          {commits.slice(0, 10).map((commit, i) => (
            <a 
              key={`${commit.sha}-${i}`}
              href={`https://github.com/${org}/${repo}/commit/${commit.sha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-void-600/30 transition-colors"
            >
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                commit.fileStatus === 'added' ? 'bg-green-500/20 text-green-400' :
                commit.fileStatus === 'removed' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {commit.fileStatus === 'added' ? 'A' : commit.fileStatus === 'removed' ? 'D' : 'M'}
              </span>
              <span className="text-xs font-mono text-electric-400">{commit.shortSha}</span>
              <span className="text-xs text-frost-300/60 truncate flex-1">{commit.message}</span>
              <span className="text-xs text-frost-300/40">{new Date(commit.date).toLocaleDateString()}</span>
            </a>
          ))}
          {commits.length > 10 && (
            <p className="text-xs text-frost-300/50 text-center py-2">+{commits.length - 10} more changes</p>
          )}
        </div>
      )}
    </div>
  )
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} className="p-2 rounded-lg bg-void-700/50 hover:bg-void-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4 text-frost-200" /></button>
      <span className="text-sm text-frost-300/60">{currentPage + 1} / {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} className="p-2 rounded-lg bg-void-700/50 hover:bg-void-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRightIcon className="w-4 h-4 text-frost-200" /></button>
    </div>
  )
}

// ============ MAIN COMPONENT ============

export function FileHistory({ token, org, allRepos }) {
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [repoSearch, setRepoSearch] = useState('')
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [tree, setTree] = useState([])
  const [loadingTree, setLoadingTree] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [mode, setMode] = useState('file') // 'file' | 'excavation'
  
  // File history state
  const [fileCommits, setFileCommits] = useState([])
  const [loadingFileHistory, setLoadingFileHistory] = useState(false)
  const [viewingCommit, setViewingCommit] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  
  // Excavation state
  const [excavationQuery, setExcavationQuery] = useState('')
  const [excavationResults, setExcavationResults] = useState(null)
  const [loadingExcavation, setLoadingExcavation] = useState(false)
  const [excavationProgress, setExcavationProgress] = useState(null)
  const [associatedPRs, setAssociatedPRs] = useState([])
  const [excavationScope, setExcavationScope] = useState('branch') // 'branch' | 'repo'
  const [activeResultTab, setActiveResultTab] = useState('commits') // 'commits' | 'files'
  
  const toast = useToast()

  if (!token || !org) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-medium">Missing Configuration</p>
      </div>
    )
  }

  const filteredRepos = (allRepos || []).filter(repo => repo.name.toLowerCase().includes(repoSearch.toLowerCase()))

  const handleSelectRepo = async (repo) => {
    setSelectedRepo(repo)
    setSelectedBranch(null)
    setSelectedFile(null)
    setFileCommits([])
    setFileContent(null)
    setExcavationResults(null)
    setLoadingBranches(true)
    
    try {
      const branchList = await fetchBranches(token, org, repo.name)
      setBranches(branchList)
      const defaultBranch = branchList.find(b => b.name === repo.defaultBranch) || branchList[0]
      if (defaultBranch) {
        setSelectedBranch(defaultBranch.name)
        await loadTree(repo.name, defaultBranch.name)
      }
    } catch (e) {
      toast.apiError(e.message || 'Failed to load branches')
    } finally {
      setLoadingBranches(false)
    }
  }

  const loadTree = async (repoName, branch) => {
    setLoadingTree(true)
    try {
      const treeData = await fetchRepoTree(token, org, repoName, branch)
      setTree(treeData)
    } catch (e) {
      toast.warning('Failed to load file tree')
      setTree([])
    } finally {
      setLoadingTree(false)
    }
  }

  const handleBranchChange = async (branch) => {
    setSelectedBranch(branch)
    setSelectedFile(null)
    setFileCommits([])
    setFileContent(null)
    if (selectedRepo) {
      await loadTree(selectedRepo.name, branch)
    }
  }

  const handleSelectFile = async (path, isFolder) => {
    if (isFolder) return
    
    setSelectedFile(path)
    setFileCommits([])
    setFileContent(null)
    setViewingCommit(null)
    setHistoryPage(0)
    setLoadingFileHistory(true)
    
    try {
      const commits = await fetchFileCommits(token, org, selectedRepo.name, path, selectedBranch)
      const formattedCommits = commits.map(c => ({
        sha: c.sha,
        shortSha: c.sha.substring(0, 7),
        message: c.commit.message.split('\n')[0],
        fullMessage: c.commit.message,
        date: c.commit.committer.date,
        author: c.author?.login || c.commit.author.name,
        avatarUrl: c.author?.avatar_url,
        url: c.html_url,
      }))
      setFileCommits(formattedCommits)
      
      if (formattedCommits.length > 0) {
        toast.success(`Found ${formattedCommits.length} commits for this file`)
        await loadFileContent(formattedCommits[0].sha)
      } else {
        toast.info('No commit history found for this file')
      }
    } catch (e) {
      toast.apiError(e.message || 'Failed to load file history')
    } finally {
      setLoadingFileHistory(false)
    }
  }

  const loadFileContent = async (commitSha) => {
    setViewingCommit(commitSha)
    setLoadingContent(true)
    
    try {
      const content = await fetchFileAtCommit(token, org, selectedRepo.name, selectedFile, commitSha)
      setFileContent(content)
      if (content === null) {
        toast.info('File did not exist at this commit')
      }
    } catch (e) {
      toast.apiError('Failed to load file content')
      setFileContent(null)
    } finally {
      setLoadingContent(false)
    }
  }

  const handleExcavation = async (e) => {
    e?.preventDefault()
    if (!excavationQuery.trim() || !selectedRepo) return
    
    // Check if branch is selected for branch-level search
    if (excavationScope === 'branch' && !selectedBranch) {
      toast.warning('Please select a branch first')
      return
    }
    
    setLoadingExcavation(true)
    setExcavationResults(null)
    setAssociatedPRs([])
    setActiveResultTab('commits')
    
    try {
      let results
      
      if (excavationScope === 'repo') {
        // Search across ALL branches
        toast.info(`Searching across ${branches.length} branches...`)
        results = await searchAcrossAllBranches(
          token, org, selectedRepo.name, excavationQuery, branches, setExcavationProgress
        )
        toast.success(`Found ${results.commitMessages.length} commits across ${results.branchesSearched.length} branches`)
      } else {
        // Search single branch
        results = await searchInBranch(
          token, org, selectedRepo.name, excavationQuery, selectedBranch, setExcavationProgress
        )
        toast.success(`Found ${results.commitMessages.length} commits, ${results.filesModified.size} files`)
      }
      
      setExcavationResults(results)
      
      if (results.commitMessages.length > 0) {
        const commitShas = results.commitMessages.map(c => c.sha)
        const prs = await fetchPRsForCommits(token, org, selectedRepo.name, commitShas)
        setAssociatedPRs(prs)
      }
    } catch (e) {
      toast.apiError(e.message || 'Excavation failed')
    } finally {
      setLoadingExcavation(false)
      setExcavationProgress(null)
    }
  }

  const handleReset = () => {
    setSelectedRepo(null)
    setSelectedBranch(null)
    setSelectedFile(null)
    setBranches([])
    setTree([])
    setFileCommits([])
    setFileContent(null)
    setViewingCommit(null)
    setExcavationQuery('')
    setExcavationResults(null)
    setAssociatedPRs([])
    setRepoSearch('')
  }

  const COMMITS_PER_PAGE = 10
  const totalHistoryPages = Math.ceil(fileCommits.length / COMMITS_PER_PAGE)
  const displayedCommits = fileCommits.slice(historyPage * COMMITS_PER_PAGE, (historyPage + 1) * COMMITS_PER_PAGE)

  // Convert filesModified Map to array for display
  const filesArray = excavationResults ? Array.from(excavationResults.filesModified.entries()).map(([filename, commits]) => ({ filename, commits })).sort((a, b) => b.commits.length - a.commits.length) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500/10 via-red-500/5 to-purple-500/10 border border-orange-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-xl">
              <History className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-frost-100 font-semibold text-lg">File History & Repository Excavation</h2>
              <p className="text-xs text-frost-300/60">Deep dive into file history, find deleted code, explore commit timeline</p>
            </div>
          </div>
          {selectedRepo && (
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-1.5 text-sm text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50 rounded-lg transition-all">
              <RotateCcw className="w-4 h-4" />Change Repo
            </button>
          )}
        </div>
        
        {!selectedRepo ? (
          <div className="space-y-4">
            <p className="text-sm text-frost-300/70">Select a repository to explore its complete history</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-frost-300/40" />
              <input type="text" value={repoSearch} onChange={(e) => setRepoSearch(e.target.value)} placeholder="Search repositories..." className="w-full pl-10 pr-4 py-2.5 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 focus:outline-none focus:border-orange-400/50 transition-all" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {filteredRepos.map(repo => (
                <button key={repo.name} onClick={() => handleSelectRepo(repo)} className="flex items-center gap-3 p-3 rounded-xl border bg-void-700/30 border-void-600/50 hover:border-orange-400/50 hover:bg-orange-400/5 transition-all text-left">
                  <Folder className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <span className="text-sm text-frost-200 truncate">{repo.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-yellow-400" />
                <span className="text-frost-100 font-medium">{selectedRepo.name}</span>
              </div>
              
              {/* Branch Selector - Enhanced */}
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-teal-400" />
                <select 
                  value={selectedBranch || ''} 
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="px-3 py-2 bg-void-700/50 border border-void-600/50 rounded-lg text-frost-100 text-sm focus:outline-none focus:border-teal-400/50"
                >
                  {branches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
                <span className="text-xs text-frost-300/50">({branches.length} branches)</span>
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setMode('file')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${mode === 'file' ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30' : 'bg-void-700/30 text-frost-300/60 hover:text-frost-200'}`}
                >
                  <FileText className="w-4 h-4" /> File History
                </button>
                <button
                  onClick={() => setMode('excavation')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${mode === 'excavation' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' : 'bg-void-700/30 text-frost-300/60 hover:text-frost-200'}`}
                >
                  <Network className="w-4 h-4" /> Deep Excavation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File History Mode */}
      {selectedRepo && mode === 'file' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Tree */}
          <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-4 lg:col-span-1">
            <h3 className="text-frost-100 font-medium mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4 text-yellow-400" /> Repository Files
            </h3>
            {loadingTree ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-orange-400 animate-spin" /></div>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <FileTree tree={tree} selectedPaths={selectedFile ? new Set([selectedFile]) : new Set()} onSelect={handleSelectFile} singleSelect />
              </div>
            )}
          </div>

          {/* File History & Content */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedFile ? (
              <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-8 text-center">
                <FileCode className="w-12 h-12 text-frost-300/30 mx-auto mb-4" />
                <p className="text-frost-300/60">Select a file to view its complete history</p>
              </div>
            ) : (
              <>
                <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 text-electric-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-frost-100 font-medium truncate">{selectedFile.split('/').pop()}</p>
                      <p className="text-xs text-frost-300/60 font-mono truncate">{selectedFile}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-neon-green/20 text-neon-green rounded">{fileCommits.length} versions</span>
                  </div>
                </div>

                {loadingFileHistory ? (
                  <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-8 text-center">
                    <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-4" />
                    <p className="text-frost-300/60">Loading file history...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-sm text-frost-300/60 font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> Commit History</h4>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {displayedCommits.map(commit => (
                          <FileVersionCard key={commit.sha} commit={commit} org={org} repo={selectedRepo.name} filePath={selectedFile} onViewContent={loadFileContent} viewingCommit={viewingCommit} />
                        ))}
                      </div>
                      <Pagination currentPage={historyPage} totalPages={totalHistoryPages} onPageChange={setHistoryPage} />
                    </div>

                    <div className="bg-void-900/50 border border-void-600/50 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-void-600/30 flex items-center justify-between">
                        <span className="text-sm text-frost-300/60">{viewingCommit ? `Version @ ${viewingCommit.substring(0, 7)}` : 'Select a version'}</span>
                        {viewingCommit && (
                          <a href={`https://github.com/${org}/${selectedRepo.name}/blob/${viewingCommit}/${selectedFile}`} target="_blank" rel="noopener noreferrer" className="text-xs text-electric-400 hover:text-electric-500 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> GitHub
                          </a>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-auto">
                        {loadingContent ? (
                          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-electric-400 animate-spin" /></div>
                        ) : fileContent ? (
                          <pre className="p-4 text-xs font-mono text-frost-300/80 whitespace-pre-wrap"><code>{fileContent}</code></pre>
                        ) : fileContent === null && viewingCommit ? (
                          <div className="p-8 text-center">
                            <Trash2 className="w-8 h-8 text-red-400/50 mx-auto mb-3" />
                            <p className="text-frost-300/60 text-sm">File did not exist at this commit</p>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-frost-300/40"><Eye className="w-8 h-8 mx-auto mb-3 opacity-50" /><p>Click a version to preview</p></div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Deep Excavation Mode */}
      {selectedRepo && mode === 'excavation' && (
        <div className="space-y-6">
          {/* Excavation Controls */}
          <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Network className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-frost-100 font-semibold">Deep Repository Excavation</h3>
                <p className="text-xs text-frost-300/60">Search through ALL commits - find deleted code, old implementations, file history</p>
              </div>
            </div>
            
            {/* Scope Selection */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-void-600/30 rounded-xl">
              <span className="text-sm text-frost-300/60">Search Scope:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExcavationScope('branch')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    excavationScope === 'branch' 
                      ? 'bg-teal-400/20 text-teal-400 border border-teal-400/30' 
                      : 'bg-void-700/50 text-frost-300/60 hover:text-frost-200'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Branch Level
                  {selectedBranch && <span className="text-xs opacity-70">({selectedBranch})</span>}
                </button>
                <button
                  onClick={() => setExcavationScope('repo')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    excavationScope === 'repo' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' 
                      : 'bg-void-700/50 text-frost-300/60 hover:text-frost-200'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  All Branches
                  <span className="text-xs opacity-70">({branches.length})</span>
                </button>
              </div>
            </div>
            
            {/* Info Banner */}
            <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${
              excavationScope === 'branch' ? 'bg-teal-400/10 border border-teal-400/20' : 'bg-purple-500/10 border border-purple-500/20'
            }`}>
              <Info className={`w-5 h-5 flex-shrink-0 ${excavationScope === 'branch' ? 'text-teal-400' : 'text-purple-400'}`} />
              <p className="text-xs text-frost-300/70">
                {excavationScope === 'branch' 
                  ? `Searching in branch "${selectedBranch}". Results will include commit messages and files modified.`
                  : `Searching across ALL ${branches.length} branches. This may take longer but finds everything.`
                }
              </p>
            </div>
            
            <form onSubmit={handleExcavation} className="flex gap-2">
              <input 
                type="text" 
                value={excavationQuery} 
                onChange={(e) => setExcavationQuery(e.target.value)} 
                placeholder="Search commit messages, function names, old code..." 
                className="flex-1 px-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/25" 
              />
              <button 
                type="submit" 
                disabled={loadingExcavation || !excavationQuery.trim()} 
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                {loadingExcavation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Excavate
              </button>
            </form>
            
            {excavationProgress && (
              <div className="mt-4">
                <div className="flex items-center gap-3 text-sm text-frost-300/60">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  {excavationProgress.status}
                  {excavationProgress.branchProgress && (
                    <span className="text-purple-400">
                      (Branch {excavationProgress.branchProgress.current}/{excavationProgress.branchProgress.total})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {excavationResults && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="flex items-center gap-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <p className="text-frost-100 font-medium">
                    Found {excavationResults.commitMessages.length} commits, {filesArray.length} files modified
                  </p>
                  {excavationResults.branchesSearched && (
                    <p className="text-xs text-frost-300/50">Searched {excavationResults.branchesSearched.length} branches</p>
                  )}
                </div>
              </div>
              
              {/* Tabs for Results */}
              <div className="flex items-center gap-2 p-1 bg-void-700/30 rounded-xl w-fit border border-void-600/50">
                <button
                  onClick={() => setActiveResultTab('commits')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    activeResultTab === 'commits' 
                      ? 'bg-neon-green/20 text-neon-green font-medium' 
                      : 'text-frost-300/60 hover:text-frost-200'
                  }`}
                >
                  <GitCommit className="w-4 h-4" />
                  Commits ({excavationResults.commitMessages.length})
                </button>
                <button
                  onClick={() => setActiveResultTab('files')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                    activeResultTab === 'files' 
                      ? 'bg-yellow-400/20 text-yellow-400 font-medium' 
                      : 'text-frost-300/60 hover:text-frost-200'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  Files ({filesArray.length})
                </button>
              </div>

              {/* Associated PRs */}
              {associatedPRs.length > 0 && (
                <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
                  <h4 className="text-frost-100 font-medium mb-4 flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-purple-400" />
                    Associated Pull Requests ({associatedPRs.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {associatedPRs.map(pr => (
                      <a key={pr.number} href={pr.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-void-600/30 rounded-xl hover:bg-void-600/50 transition-colors">
                        {pr.state === 'merged' ? <GitMerge className="w-4 h-4 text-purple-400" /> : <GitPullRequest className="w-4 h-4 text-green-400" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-frost-200 truncate">{pr.title}</p>
                          <p className="text-xs text-frost-300/50">#{pr.number} by {pr.author}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-frost-300/40" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Commits Tab */}
              {activeResultTab === 'commits' && (
                <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
                  <h4 className="text-frost-100 font-medium mb-4 flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-neon-green" />
                    Matching Commits
                  </h4>
                  {excavationResults.commitMessages.length === 0 ? (
                    <div className="text-center py-8 text-frost-300/60">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>No commits found matching "{excavationQuery}"</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {excavationResults.commitMessages.map(commit => (
                        <CommitCard 
                          key={commit.sha} 
                          commit={commit} 
                          org={org} 
                          repo={selectedRepo.name} 
                          showBranch={excavationScope === 'repo'}
                          showFiles
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Files Tab */}
              {activeResultTab === 'files' && (
                <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6">
                  <h4 className="text-frost-100 font-medium mb-4 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-yellow-400" />
                    Files Modified
                  </h4>
                  {filesArray.length === 0 ? (
                    <div className="text-center py-8 text-frost-300/60">
                      <Folder className="w-8 h-8 mx-auto mb-3 opacity-50" />
                      <p>No file data available (check more commits)</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {filesArray.map(({ filename, commits }) => (
                        <FileCard key={filename} filename={filename} commits={commits} org={org} repo={selectedRepo.name} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
