import * as React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { JsonErrorDisplayProps } from './json-types'
import { cn } from '@/lib/utils'

export function JsonErrorDisplay({ errors, content, className }: JsonErrorDisplayProps) {
  if (errors.length === 0) {
    return null
  }

  const getErrorLine = (error: { line: number; column: number }) => {
    const lines = content.split('\n')
    const lineIndex = error.line - 1
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const lineContent = lines[lineIndex]
      const beforeError = lineContent.substring(0, error.column - 1)
      const errorChar = lineContent.charAt(error.column - 1) || ' '
      const afterError = lineContent.substring(error.column)

      return {
        number: error.line,
        content: lineContent,
        beforeError,
        errorChar,
        afterError,
        column: error.column
      }
    }
    return null
  }

  const getErrorIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? '❌' : '⚠️'
  }

  const getErrorColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'text-red-600' : 'text-yellow-600'
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Alert variant="destructive">
        <AlertDescription className="font-medium">
          Found {errors.length} validation {errors.length === 1 ? 'error' : 'errors'}
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {errors.map((error, index) => {
          const errorLine = getErrorLine(error)

          return (
            <div
              key={index}
              className={cn(
                'border rounded-lg p-4',
                error.severity === 'error'
                  ? 'border-red-200 bg-red-50'
                  : 'border-yellow-200 bg-yellow-50'
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className={cn('text-lg', getErrorColor(error.severity))}>
                  {getErrorIcon(error.severity)}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={error.severity === 'error' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      Line {error.line}, Column {error.column}
                    </Badge>
                  </div>
                  <p className={cn('text-sm font-medium', getErrorColor(error.severity))}>
                    {error.message}
                  </p>
                </div>
              </div>

              {errorLine && (
                <div className="bg-white rounded border p-3 font-mono text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-500 text-xs">Line {errorLine.number}:</span>
                  </div>
                  <div className="relative">
                    <div className="text-gray-700">
                      <span className="text-gray-400">{errorLine.beforeError}</span>
                      <span
                        className={cn(
                          'bg-red-200 px-0.5 rounded',
                          error.severity === 'error' ? 'bg-red-200' : 'bg-yellow-200'
                        )}
                      >
                        {errorLine.errorChar}
                      </span>
                      <span className="text-gray-400">{errorLine.afterError}</span>
                    </div>
                    {errorLine.errorChar && (
                      <div
                        className={cn(
                          'absolute top-5 h-0.5 w-4',
                          error.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                        )}
                        style={{
                          left: `${errorLine.beforeError.length * 8}px`
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
