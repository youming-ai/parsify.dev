import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import './JsonViewer.css'
import { JsonNodeModel } from '../../lib/models/JsonNode'
import type { JsonNode } from '../../lib/types'
import { SearchComponent } from '../Search/SearchComponent'

interface JsonViewerProps {
  data: JsonNode
  className?: string
  expandAll?: boolean
  showLineNumbers?: boolean
  searchable?: boolean
  copyable?: boolean
  theme?: 'light' | 'dark' | 'auto'
  maxDepth?: number
  onPathSelect?: (path: string) => void
}

interface JsonNodeComponentProps {
  data: JsonNode
  path: string
  depth: number
  isExpanded: boolean
  onToggle: (path: string) => void
  onPathSelect?: (path: string) => void
  showLineNumbers?: boolean
  copyable?: boolean
  theme?: 'light' | 'dark' | 'auto'
  maxDepth?: number
  lineNumber?: number
}

const JsonNodeComponent: React.FC<JsonNodeComponentProps> = ({
  data,
  path,
  depth,
  isExpanded,
  onToggle,
  onPathSelect,
  showLineNumbers = false,
  copyable = false,
  theme = 'auto',
  maxDepth = 20,
  lineNumber = 0,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [])

  const handleClick = useCallback(() => {
    if (typeof data === 'object' && data !== null) {
      onToggle(path)
    }
    onPathSelect?.(path)
  }, [data, path, onToggle, onPathSelect])

  const handleCopyPath = useCallback(() => {
    handleCopy(path)
  }, [path, handleCopy])

  const handleCopyValue = useCallback(() => {
    const value = JsonNodeModel.formatValue(data)
    handleCopy(value)
  }, [data, handleCopy])

  const getNodeIcon = (node: JsonNode): string => {
    if (node === null) return 'null'
    if (Array.isArray(node)) return 'array'
    if (typeof node === 'object') return 'object'
    if (typeof node === 'string') return 'string'
    if (typeof node === 'number') return 'number'
    if (typeof node === 'boolean') return 'boolean'
    return 'unknown'
  }

  const renderValue = (): JSX.Element => {
    if (data === null) {
      return <span className="json-null">null</span>
    }

    if (Array.isArray(data)) {
      return (
        <>
          <span className="json-bracket">[</span>
          {data.length > 0 && (
            <span className="json-array-info">
              {data.length} {data.length === 1 ? 'item' : 'items'}
            </span>
          )}
          <span className="json-bracket">]</span>
        </>
      )
    }

    if (typeof data === 'object') {
      const keys = Object.keys(data)
      return (
        <>
          <span className="json-brace">{'{'}</span>
          {keys.length > 0 && (
            <span className="json-object-info">
              {keys.length} {keys.length === 1 ? 'property' : 'properties'}
            </span>
          )}
          <span className="json-brace">{'}'}</span>
        </>
      )
    }

    if (typeof data === 'string') {
      return <span className="json-string">"{data}"</span>
    }

    if (typeof data === 'number') {
      return <span className="json-number">{data}</span>
    }

    if (typeof data === 'boolean') {
      return <span className={`json-boolean json-boolean--${data}`}>{String(data)}</span>
    }

    return <span className="json-unknown">{String(data)}</span>
  }

  const hasChildren = data !== null && typeof data === 'object'

  return (
    <div
      className={`json-node json-node--${getNodeIcon(data)} json-node--${theme} ${isHovered ? 'hovered' : ''}`}
      style={{ marginLeft: depth > 0 ? `${depth * 20}px` : 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showLineNumbers && <span className="line-number">{lineNumber}</span>}

      {hasChildren && (
        <button
          type="button"
          className="expand-toggle"
          onClick={handleClick}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          aria-expanded={isExpanded}
        >
          <span className={`expand-icon ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
      )}

      <div
        className="json-content"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`JSON node at ${path}`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {renderValue()}
      </div>

      {isHovered && copyable && (
        <div className="node-actions">
          <button
            type="button"
            className="copy-button"
            onClick={handleCopyValue}
            aria-label="Copy value"
            title="Copy value"
          >
            {copySuccess ? '✓' : '📋'}
          </button>
          <button
            type="button"
            className="copy-button"
            onClick={handleCopyPath}
            aria-label="Copy path"
            title="Copy JSON path"
          >
            📍
          </button>
        </div>
      )}

      {hasChildren && isExpanded && depth < maxDepth && (
        <div className="json-children">
          {Array.isArray(data)
            ? data.map((item, index) => (
                <JsonNodeComponent
                  key={`${path}[${index}]`}
                  data={item}
                  path={`${path}[${index}]`}
                  depth={depth + 1}
                  isExpanded={false}
                  onToggle={onToggle}
                  onPathSelect={onPathSelect}
                  showLineNumbers={showLineNumbers}
                  copyable={copyable}
                  theme={theme}
                  maxDepth={maxDepth}
                  lineNumber={lineNumber + index + 1}
                />
              ))
            : Object.entries(data).map(([key, value], index) => (
                <JsonNodeComponent
                  key={`${path}.${key}`}
                  data={value}
                  path={`${path}.${key}`}
                  depth={depth + 1}
                  isExpanded={false}
                  onToggle={onToggle}
                  onPathSelect={onPathSelect}
                  showLineNumbers={showLineNumbers}
                  copyable={copyable}
                  theme={theme}
                  maxDepth={maxDepth}
                  lineNumber={lineNumber + index + 1}
                />
              ))}
        </div>
      )}
    </div>
  )
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  className = '',
  expandAll = false,
  showLineNumbers = false,
  searchable = true,
  copyable = true,
  theme = 'auto',
  maxDepth = 20,
  onPathSelect,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [_searchTerm, _setSearchTerm] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

  const handleSearchResultSelect = useCallback(
    (path: string, _node: JsonNode) => {
      // Expand all parent paths to make the result visible
      const parentPaths = path.split('.').slice(0, -1)
      let currentPath = ''

      parentPaths.forEach(part => {
        currentPath = currentPath ? `${currentPath}.${part}` : part
        setExpandedPaths(prev => new Set(prev).add(currentPath))
      })

      onPathSelect?.(path)
    },
    [onPathSelect]
  )

  const expandAllNodes = useCallback(() => {
    const collectPaths = (node: JsonNode, currentPath: string): string[] => {
      const paths: string[] = []

      if (node && typeof node === 'object') {
        paths.push(currentPath)

        if (Array.isArray(node)) {
          node.forEach((item, index) => {
            paths.push(...collectPaths(item, `${currentPath}[${index}]`))
          })
        } else {
          Object.entries(node).forEach(([key, value]) => {
            paths.push(...collectPaths(value, `${currentPath}.${key}`))
          })
        }
      }

      return paths
    }

    const allPaths = collectPaths(data, 'root')
    setExpandedPaths(new Set(allPaths))
  }, [data])

  const collapseAllNodes = useCallback(() => {
    setExpandedPaths(new Set())
  }, [])

  const handleCopyAll = useCallback(async () => {
    try {
      const formattedJson = JsonNodeModel.formatValue(data)
      await navigator.clipboard.writeText(formattedJson)
    } catch (error) {
      console.error('Failed to copy JSON:', error)
    }
  }, [data])

  useEffect(() => {
    if (expandAll) {
      expandAllNodes()
    }
  }, [expandAll, expandAllNodes])

  return (
    <div className={`json-viewer json-viewer--${theme} ${className}`} ref={viewerRef}>
      <div className="json-viewer-header">
        <div className="json-viewer-controls">
          {searchable && (
            <SearchComponent
              data={data}
              onResultSelect={handleSearchResultSelect}
              placeholder="Search JSON..."
              maxResults={100}
            />
          )}

          <div className="json-viewer-actions">
            <button
              type="button"
              onClick={expandAllNodes}
              className="action-button"
              title="Expand all"
            >
              Expand All
            </button>

            <button
              type="button"
              onClick={collapseAllNodes}
              className="action-button"
              title="Collapse all"
            >
              Collapse All
            </button>

            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="action-button"
              title={showRaw ? 'Show formatted' : 'Show raw'}
            >
              {showRaw ? 'Formatted' : 'Raw'}
            </button>

            {copyable && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="action-button"
                title="Copy JSON"
              >
                Copy
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="json-viewer-content">
        {showRaw ? (
          <pre className="json-raw">
            <code>{JsonNodeModel.formatValue(data)}</code>
          </pre>
        ) : (
          <div className="json-tree">
            <JsonNodeComponent
              data={data}
              path="root"
              depth={0}
              isExpanded={expandedPaths.has('root')}
              onToggle={handleToggle}
              onPathSelect={onPathSelect}
              showLineNumbers={showLineNumbers}
              copyable={copyable}
              theme={theme}
              maxDepth={maxDepth}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default JsonViewer
