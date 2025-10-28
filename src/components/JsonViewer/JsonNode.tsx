import type React from 'react'
import './JsonNode.css'
import type { JsonNode } from '../../lib/types'

interface JsonNodeProps {
  data: JsonNode
  path: string
  depth: number
  expanded: boolean
  onToggle: (path: string) => void
  theme?: 'light' | 'dark' | 'auto'
  copyable?: boolean
}

// Simplified JsonNode component that's used by JsonViewer
export const JsonNodeComponent: React.FC<JsonNodeProps> = ({
  data,
  path,
  depth,
  expanded,
  onToggle,
  theme = 'auto',
  copyable = false,
}) => {
  const handleToggle = () => {
    if (typeof data === 'object' && data !== null) {
      onToggle(path)
    }
  }

  const getNodeIcon = (): string => {
    if (data === null) return 'null'
    if (Array.isArray(data)) return '[ ]'
    if (typeof data === 'object') return '{ }'
    if (typeof data === 'string') return '"'
    if (typeof data === 'number') return '#'
    if (typeof data === 'boolean') return 'T/F'
    return '?'
  }

  const formatValue = (): string => {
    if (data === null) return 'null'
    if (typeof data === 'string') return `"${data}"`
    if (typeof data === 'boolean') return data.toString()
    if (typeof data === 'number') return data.toString()
    if (Array.isArray(data)) return `Array(${data.length})`
    if (typeof data === 'object') return `Object(${Object.keys(data).length})`
    return String(data)
  }

  const hasChildren = data !== null && typeof data === 'object'

  return (
    <div
      className={`json-node-simple json-node-simple--${theme}`}
      style={{ marginLeft: `${depth * 16}px` }}
    >
      {hasChildren && (
        <button
          type="button"
          className="expand-toggle-simple"
          onClick={handleToggle}
          aria-expanded={expanded}
        >
          <span className={`expand-icon-simple ${expanded ? 'expanded' : 'collapsed'}`}>
            {expanded ? '▼' : '▶'}
          </span>
          <span className="node-icon-simple">{getNodeIcon()}</span>
        </button>
      )}

      {!hasChildren && <span className="node-icon-simple">{getNodeIcon()}</span>}

      <span className="node-value-simple">{formatValue()}</span>

      {hasChildren && expanded && depth < 10 && (
        <div className="node-children-simple">
          {Array.isArray(data)
            ? data.map((item, index) => (
                <JsonNodeComponent
                  key={`${path}[${index}]`}
                  data={item}
                  path={`${path}[${index}]`}
                  depth={depth + 1}
                  expanded={false}
                  onToggle={onToggle}
                  theme={theme}
                  copyable={copyable}
                />
              ))
            : Object.entries(data).map(([key, value]) => (
                <JsonNodeComponent
                  key={`${path}.${key}`}
                  data={value}
                  path={`${path}.${key}`}
                  depth={depth + 1}
                  expanded={false}
                  onToggle={onToggle}
                  theme={theme}
                  copyable={copyable}
                />
              ))}
        </div>
      )}
    </div>
  )
}

export default JsonNodeComponent
