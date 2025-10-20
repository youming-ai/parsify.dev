/**
 * Analytics Page
 * Main analytics dashboard page
 */

import { Metadata } from 'next'
import { AnalyticsDashboard } from '@/components/analytics'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Parsify.dev',
  description: 'Monitor your application performance and user engagement with comprehensive analytics.',
  robots: 'noindex, nofollow',
}

export default function AnalyticsPage() {
  return (
    <AnalyticsProvider>
      <div className="container mx-auto py-8">
        <AnalyticsDashboard />
      </div>
    </AnalyticsProvider>
  )
}
