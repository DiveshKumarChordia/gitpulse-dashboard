import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, FileText, File, Check } from 'lucide-react'

const FILE_ICONS = {
  js: '🟨',
  jsx: '⚛️',
  ts: '🔷',
  tsx: '⚛️',
  py: '🐍',
  rb: '💎',
  go: '🔵',
  rs: '🦀',
  java: '☕',
  kt: '🟣',
  swift: '🍎',
  php: '🐘',
  html: '🌐',
  css: '🎨',
  scss: '🎨',
  json: '📋',
  yaml: '📋',
  yml: '📋',
  md: '📝',
  sql: '🗃️',
  sh: '🖥️',
  dockerfile: '🐳',
}

function getFileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || null
}

function TreeNode({ node, depth = 0, selectedPaths, onSelect, expandedFolders, onToggleFolder }) {
  const isFolder = node.type === 'tree'
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = selectedPaths.has(node.path)
  const hasSelectedChildren = isFolder && node.children?.some(child => 
    selectedPaths.has(child.path) || 
    (child.type === 'tree' && child.children?.some(c => selectedPaths.has(c.path)))
  )

  const handleClick = (e) => {
    e.stopPropagation()
    if (isFolder) {
      onToggleFolder(node.path)
    }
  }

  const handleSelect = (e) => {
    e.stopPropagation()
    onSelect(node.path, isFolder, node)
  }

  const fileIcon = getFileIcon(node.name)

  return (
    <div>
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all group ${
          isSelected 
            ? 'bg-electric-400/20 text-electric-400' 
            : hasSelectedChildren
              ? 'bg-electric-400/10'
              : 'hover:bg-void-600/50'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse icon for folders */}
        {isFolder ? (
          <button className="p-0.5 hover:bg-void-500/50 rounded transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-frost-300/60" />
            ) : (
              <ChevronRight className="w-4 h-4 text-frost-300/60" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Checkbox */}
        <button
          onClick={handleSelect}
          className={`flex-shrink-0 w-4 h-4 rounded border transition-all ${
            isSelected 
              ? 'bg-electric-400 border-electric-400' 
              : hasSelectedChildren
                ? 'bg-electric-400/30 border-electric-400/50'
                : 'border-frost-300/30 hover:border-electric-400/50'
          }`}
        >
          {(isSelected || hasSelectedChildren) && (
            <Check className="w-3 h-3 text-void-900 mx-auto" />
          )}
        </button>

        {/* Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          )
        ) : fileIcon ? (
          <span className="text-sm flex-shrink-0">{fileIcon}</span>
        ) : (
          <FileCode className="w-4 h-4 text-frost-300/60 flex-shrink-0" />
        )}

        {/* Name */}
        <span className={`text-sm truncate ${isFolder ? 'font-medium text-frost-100' : 'text-frost-200'}`}>
          {node.name}
        </span>
      </div>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPaths={selectedPaths}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ tree, selectedPaths, onSelect }) {
  const [expandedFolders, setExpandedFolders] = useState(new Set())

  const handleToggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleExpandAll = () => {
    const allFolders = new Set()
    const collectFolders = (nodes) => {
      for (const node of nodes) {
        if (node.type === 'tree') {
          allFolders.add(node.path)
          if (node.children) collectFolders(node.children)
        }
      }
    }
    collectFolders(tree)
    setExpandedFolders(allFolders)
  }

  const handleCollapseAll = () => {
    setExpandedFolders(new Set())
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-frost-300/60">
          {selectedPaths.size > 0 ? `${selectedPaths.size} selected` : 'Select files/folders (optional)'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleExpandAll}
            className="text-xs text-electric-400 hover:text-electric-500 transition-colors"
          >
            Expand all
          </button>
          <button
            onClick={handleCollapseAll}
            className="text-xs text-frost-300/60 hover:text-frost-200 transition-colors"
          >
            Collapse
          </button>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto border border-void-600/50 rounded-xl bg-void-800/50 p-2">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-frost-300/40 text-sm">
            No files found
          </div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              selectedPaths={selectedPaths}
              onSelect={onSelect}
              expandedFolders={expandedFolders}
              onToggleFolder={handleToggleFolder}
            />
          ))
        )}
      </div>
    </div>
  )
}

