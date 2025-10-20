import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JsonFormatterProps, JsonFormatOptions } from './json-types'
import { formatJson, copyToClipboard, downloadFile } from './json-utils'
import { cn } from '@/lib/utils'
import { Settings2, Copy, Download, Play } from 'lucide-react'

export function JsonFormatter({
  input,
  options = defaultFormatOptions,
  onFormat,
  onError,
  className
}: JsonFormatterProps) {
  const [formatOptions, setFormatOptions] = React.useState<JsonFormatOptions>(options)
  const [isFormatting, setIsFormatting] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [formattedOutput, setFormattedOutput] = React.useState('')
  const [showCopyNotification, setShowCopyNotification] = React.useState(false)

  const handleFormat = React.useCallback(async () => {
    if (!input.trim()) {
      onError('No input to format')
      return
    }

    setIsFormatting(true)

    try {
      const formatted = formatJson(input, formatOptions)
      setFormattedOutput(formatted)
      onFormat(formatted)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown formatting error'
      onError(errorMessage)
      setFormattedOutput('')
    } finally {
      setIsFormatting(false)
    }
  }, [input, formatOptions, onFormat, onError])

  const handleCopy = async () => {
    if (!formattedOutput) return

    try {
      await copyToClipboard(formattedOutput)
      setShowCopyNotification(true)
      setTimeout(() => setShowCopyNotification(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    if (!formattedOutput) return

    const filename = `formatted-json-${new Date().toISOString().slice(0, 10)}.json`
    downloadFile(formattedOutput, filename, 'application/json')
  }

  const handleOptionChange = (key: keyof JsonFormatOptions, value: boolean | number) => {
    const newOptions = { ...formatOptions, [key]: value }
    setFormatOptions(newOptions)

    // Auto-format if we have input
    if (input.trim()) {
      try {
        const formatted = formatJson(input, newOptions)
        setFormattedOutput(formatted)
        onFormat(formatted)
      } catch (error) {
        // Don't show error for auto-format attempts
      }
    }
  }

  // Auto-format when input changes if we have valid formatted output
  React.useEffect(() => {
    if (input.trim() && formattedOutput) {
      handleFormat()
    }
  }, [input]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn('space-y-4', className)}>
      {/* Settings Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Format Options
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? 'Hide' : 'Show'} Settings
            </Button>
          </div>
        </CardHeader>

        {showSettings && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Indent Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Indent Size: {formatOptions.indent}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={formatOptions.indent}
                    onChange={(e) => handleOptionChange('indent', parseInt(e.target.value, 10))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-8">
                    {formatOptions.indent}
                  </span>
                </div>
              </div>

              {/* Sort Keys */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort Keys
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sort-keys"
                    checked={formatOptions.sortKeys}
                    onChange={(e) => handleOptionChange('sortKeys', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="sort-keys" className="text-sm text-gray-600">
                    Alphabetically sort object keys
                  </label>
                </div>
              </div>

              {/* Compact Mode */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Compact Mode
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="compact"
                    checked={formatOptions.compact}
                    onChange={(e) => handleOptionChange('compact', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="compact" className="text-sm text-gray-600">
                    Remove all whitespace
                  </label>
                </div>
              </div>

              {/* Trailing Commas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Trailing Commas
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trailing-commas"
                    checked={formatOptions.trailingComma}
                    onChange={(e) => handleOptionChange('trailingComma', e.target.checked)}
                    disabled={formatOptions.compact}
                    className="mr-2"
                  />
                  <label htmlFor="trailing-commas" className="text-sm text-gray-600">
                    Add trailing commas
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Format Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleFormat}
          disabled={isFormatting || !input.trim()}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {isFormatting ? 'Formatting...' : 'Format JSON'}
        </Button>

        {formattedOutput && (
          <>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </Button>

            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </>
        )}
      </div>

      {/* Formatted Output */}
      {formattedOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Formatted Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 border rounded-lg p-4 overflow-auto max-h-96 font-mono text-sm text-gray-800">
              {formattedOutput}
            </pre>
            <div className="mt-2 text-sm text-gray-600">
              {formattedOutput.split('\n').length} lines, {formattedOutput.length} characters
            </div>
          </CardContent>
        </Card>
      )}

      {/* Copy Notification */}
      {showCopyNotification && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span className="text-sm">Copied to clipboard!</span>
        </div>
      )}
    </div>
  )
}

const defaultFormatOptions: JsonFormatOptions = {
  indent: 2,
  sortKeys: false,
  compact: false,
  trailingComma: false
}
