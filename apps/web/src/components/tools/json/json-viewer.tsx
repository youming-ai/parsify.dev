import * as React from 'react'
import { Button } from '@/components/ui/button'
import { JsonViewerProps, TreeNode } from './json-types'
import { parseJsonToTree, copyToClipboard, downloadFile } from './json-utils'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Copy, Download } from 'lucide-react'

interface JsonTreeItemProps {
  node: TreeNode
  level: number
  showLineNumbers: boolean
  lineNumber: { current: number }
  onCopy: (path: string, value: unknown) => void
}

function JsonTreeItem({ node, level, showLineNumbers, lineNumber, onCopy }: JsonTreeItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(node.isExpanded ?? level < 3)

  const hasChildren = node.children && node.children.length > 0
  const isLastChild = node.key.endsWith(']') && !isNaN(parseInt(node.key.split('[').pop() || ''))

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const renderValue = () => {
    if (hasChildren) {
      return null // Will render children separately
    }

    let displayValue: string
    let valueClass: string

    switch (node.type) {
      case 'string':
        displayValue = `"${String(node.value)}"`
        valueClass = 'text-green-600'
        break
      case 'number':
        displayValue = String(node.value)
        valueClass = 'text-blue-600'
        break
      case 'boolean':
        displayValue = String(node.value)
        valueClass = 'text-purple-600'
        break
      case 'null':
        displayValue = 'null'
        valueClass = 'text-gray-500'
        break
      default:
        displayValue = String(node.value)
        valueClass = 'text-gray-700'
    }

    return (
      <span
        className={cn('font-mono', valueClass, 'cursor-pointer hover:opacity-70')}
        onClick={() => onCopy(node.path, node.value)}
        title="Click to copy value"
      >
        {displayValue}
      </span>
    )
  }

  const renderKey = () => {
    if (node.path === 'root') {
      return null
    }

    const keyName = node.key.includes('[') ? node.key : `"${node.key}"`
    return (
      <span
        className={cn('font-mono text-gray-700 font-medium cursor-pointer hover:opacity-70')}
        onClick={() => onCopy(node.path, node.value)}
        title={`Copy ${node.path}`}
      >
        {keyName}:
      </span>
    )
  }

  return (
    <div className={cn('font-mono text-sm', 'select-text')}>
      <div className={cn('flex items-start gap-1', 'hover:bg-gray-50 px-1 rounded')}>
        {showLineNumbers && (
          <span className="text-gray-400 text-xs mr-2 select-none w-8 text-right">
            {lineNumber.current++}
          </span>
        )}

        <div className="flex-1">
          {/* Indentation */}
          {level > 0 && (
            <span className="inline-block" style={{ width: `${level * 20}px` }} />
          )}

          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={toggleExpand}
              className={cn(
                'inline-flex items-center justify-center w-4 h-4 mr-1',
                'text-gray-400 hover:text-gray-600',
                'focus:outline-none focus:text-gray-600'
              )}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}

          {!hasChildren && (
            <span className="inline-block w-4 h-4 mr-1" />
          )}

          {/* Key */}
          {renderKey()}

          {/* Value */}
          {renderValue()}

          {/* Container brackets */}
          {hasChildren && (
            <>
              <span className="text-gray-600">
                {node.type === 'object' ? '{' : '['}
              </span>
              {!isExpanded && (
                <>
                  <span className="text-gray-400 mx-1">
                    {node.children?.length} {node.type === 'object' ? 'properties' : 'items'}
                  </span>
                  <span className="text-gray-600">
                    {node.type === 'object' ? '}' : ']'}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child, index) => (
            <JsonTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              showLineNumbers={showLineNumbers}
              lineNumber={lineNumber}
              onCopy={onCopy}
            />
          ))}

          {/* Closing bracket */}
          <div className={cn('flex items-start gap-1', 'hover:bg-gray-50 px-1 rounded')}>
            {showLineNumbers && (
              <span className="text-gray-400 text-xs mr-2 select-none w-8 text-right">
                {lineNumber.current++}
              </span>
            )}
            <div className="flex-1">
              <span className="inline-block" style={{ width: `${(level + 1) * 20}px` }} />
              <span className="text-gray-600">
                {node.type === 'object' ? '}' : ']'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function JsonViewer({
  data,
  expandLevel = 3,
  showLineNumbers = false,
  copyable = true,
  className
}: JsonViewerProps) {
  const [showCopyNotification, setShowCopyNotification] = React.useState(false)
  const [copiedValue, setCopiedValue] = React.useState('')

  // Parse data to tree structure
  const treeData = React.useMemo(() => {
    return parseJsonToTree(data)
  }, [data])

  const handleCopy = (path: string, value: unknown) => {
    if (!copyable) return

    const valueToCopy = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    copyToClipboard(valueToCopy)
      .then(() => {
        setCopiedValue(valueToCopy)
        setShowCopyNotification(true)
        setTimeout(() => setShowCopyNotification(false), 2000)
      })
      .catch(console.error)
  }

  const handleCopyAll = () => {
    if (!copyable) return

    const jsonString = JSON.stringify(data, null, 2)
    copyToClipboard(jsonString)
      .then(() => {
        setCopiedValue('All JSON data')
        setShowCopyNotification(true)
        setTimeout(() => setShowCopyNotification(false), 2000)
      })
      .catch(console.error)
  }

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2)
    downloadFile(jsonString, 'formatted-json.json', 'application/json')
  }

  const lineNumber = React.useRef(1)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900">JSON Viewer</h3>
          <span className="text-sm text-gray-500">
            ({treeData.length} {treeData.length === 1 ? 'item' : 'items'})
          </span>
        </div>

        {copyable && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
          </div>
        )}
      </div>

      {/* JSON Tree */}
      <div className="border rounded-lg bg-gray-50 p-4 overflow-auto max-h-96">
        {treeData.map((node) => (
          <JsonTreeItem
            key={node.path}
            node={node}
            level={0}
            showLineNumbers={showLineNumbers}
            lineNumber={lineNumber}
            onCopy={handleCopy}
          />
        ))}

        {treeData.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No data to display
          </div>
        )}
      </div>

      {/* Copy notification */}
      {showCopyNotification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm">Copied to clipboard</span>
        </div>
      )}
    </div>
  )
}
