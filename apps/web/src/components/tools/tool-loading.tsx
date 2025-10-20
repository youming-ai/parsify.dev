import * as React from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { ToolLoadingProps } from './tool-types'
import { cn } from '@/lib/utils'

export function ToolLoading({ message = 'Processing...', className }: ToolLoadingProps) {
  return (
    <Card className={cn('border-gray-200', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" className="mb-4" />
        <p className="text-gray-600 text-center">{message}</p>
      </CardContent>
    </Card>
  )
}

interface ToolInlineLoadingProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ToolInlineLoading({
  message = 'Loading...',
  className,
  size = 'sm'
}: ToolInlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2 text-gray-600', className)}>
      <Spinner size={size} />
      <span className="text-sm">{message}</span>
    </div>
  )
}
