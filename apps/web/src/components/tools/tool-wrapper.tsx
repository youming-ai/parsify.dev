import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { ToolWrapperProps } from './tool-types'
import { cn } from '@/lib/utils'

export function ToolWrapper({
  children,
  title,
  description,
  category,
  status,
  error,
  className,
  features = [],
  version,
}: ToolWrapperProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'loading':
        return { label: 'Loading', variant: 'secondary' as const }
      case 'success':
        return { label: 'Complete', variant: 'default' as const }
      case 'error':
        return { label: 'Error', variant: 'destructive' as const }
      default:
        return { label: 'Ready', variant: 'outline' as const }
    }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className={cn('container mx-auto py-6', className)}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{category}</Badge>
          {status && (
            <Badge variant={statusBadge.variant}>
              {status === 'loading' && <Spinner size="sm" className="mr-1" />}
              {statusBadge.label}
            </Badge>
          )}
          {version && <Badge variant="outline">v{version}</Badge>}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>

        {features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {features.map(feature => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className={cn(getStatusColor(), 'transition-colors duration-200')}>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  )
}
