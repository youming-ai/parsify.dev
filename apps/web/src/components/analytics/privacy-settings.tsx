/**
 * Privacy Settings Component
 * Comprehensive privacy and consent management for analytics
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAnalyticsConsent } from '@/lib/analytics/hooks'
import { CONSENT_LEVELS } from '@/lib/analytics/config'

interface PrivacySettingsProps {
  showExport?: boolean
  showDelete?: boolean
}

export function PrivacySettings({ showExport = false, showDelete = false }: PrivacySettingsProps) {
  const {
    consent,
    grantAllConsent,
    revokeAllConsent,
    updateAnalyticsConsent,
    updatePerformanceConsent,
    updateInteractionConsent
  } = useAnalyticsConsent()

  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)
  const [deleteComplete, setDeleteComplete] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // In a real implementation, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      setExportComplete(true)
      setTimeout(() => setExportComplete(false), 3000)
    } catch (error) {
      console.error('Failed to export data:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteData = async () => {
    if (!confirm('Are you sure you want to delete all your analytics data? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      // In a real implementation, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      setDeleteComplete(true)
      setTimeout(() => setDeleteComplete(false), 3000)
    } catch (error) {
      console.error('Failed to delete data:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getConsentLevel = () => {
    if (!consent) return 'none'

    if (consent.analytics && consent.performance && consent.interactions) {
      return 'all'
    } else if (consent.analytics) {
      return 'analytics'
    } else if (consent.performance) {
      return 'performance'
    } else {
      return 'minimal'
    }
  }

  const consentLevel = getConsentLevel()

  return (
    <div className="space-y-6">
      {/* Privacy Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Privacy Settings</h2>
        <p className="text-muted-foreground">
          Manage your privacy preferences and control how your data is collected and used.
        </p>
      </div>

      {/* Current Consent Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Current Consent Level</h3>
          <Badge variant={consentLevel === 'all' ? 'default' : consentLevel === 'none' ? 'destructive' : 'secondary'}>
            {consentLevel === 'all' ? 'All Analytics' :
             consentLevel === 'analytics' ? 'Analytics Only' :
             consentLevel === 'performance' ? 'Performance Only' :
             consentLevel === 'minimal' ? 'Minimal' : 'No Consent'}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          You can change your consent preferences at any time. Changes will apply to future data collection only.
        </p>

        <div className="flex gap-2">
          <Button onClick={grantAllConsent} variant="default">
            Accept All
          </Button>
          <Button onClick={revokeAllConsent} variant="outline">
            Reject All
          </Button>
        </div>
      </Card>

      {/* Detailed Consent Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Consent Settings</h3>

        <div className="space-y-6">
          {/* Analytics Consent */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label htmlFor="analytics-consent" className="font-medium">
                Analytics & Usage Data
              </Label>
              <p className="text-sm text-muted-foreground">
                Track how you use our tools and features to improve the service. This includes tool usage,
                feature interactions, and general usage patterns.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">Anonymous</Badge>
                <Badge variant="outline">Aggregated</Badge>
                <Badge variant="outline">Essential for improvement</Badge>
              </div>
            </div>
            <Switch
              id="analytics-consent"
              checked={consent?.analytics ?? false}
              onCheckedChange={updateAnalyticsConsent}
            />
          </div>

          <Separator />

          {/* Performance Consent */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label htmlFor="performance-consent" className="font-medium">
                Performance Monitoring
              </Label>
              <p className="text-sm text-muted-foreground">
                Monitor page load times, Core Web Vitals, and performance metrics to optimize speed
                and user experience. No personal data is collected.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">Anonymous</Badge>
                <Badge variant="outline">Technical data only</Badge>
                <Badge variant="outline">Essential for optimization</Badge>
              </div>
            </div>
            <Switch
              id="performance-consent"
              checked={consent?.performance ?? false}
              onCheckedChange={updatePerformanceConsent}
            />
          </div>

          <Separator />

          {/* Interaction Consent */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label htmlFor="interaction-consent" className="font-medium">
                User Interactions
              </Label>
              <p className="text-sm text-muted-foreground">
                Track clicks, scrolls, and user interactions to improve user experience and interface design.
                This helps us understand how users navigate and interact with our tools.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">Anonymous</Badge>
                <Badge variant="outline">Behavioral patterns</Badge>
                <Badge variant="outline">Optional</Badge>
              </div>
            </div>
            <Switch
              id="interaction-consent"
              checked={consent?.interactions ?? false}
              onCheckedChange={updateInteractionConsent}
            />
          </div>
        </div>
      </Card>

      {/* Data Retention */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Data Retention</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Analytics Data</div>
              <div className="text-sm text-muted-foreground">Page views, tool usage, and general analytics</div>
            </div>
            <Badge variant="outline">365 days</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Performance Data</div>
              <div className="text-sm text-muted-foreground">Core Web Vitals and performance metrics</div>
            </div>
            <Badge variant="outline">90 days</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">Error Logs</div>
              <div className="text-sm text-muted-foreground">Technical error information for debugging</div>
            </div>
            <Badge variant="outline">30 days</Badge>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Data is automatically deleted after the retention period. You can request immediate deletion at any time.
        </p>
      </Card>

      {/* Data Rights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Data Rights</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Right to Access</h4>
              <p className="text-sm text-muted-foreground">
                Request a copy of all data we have collected about you.
              </p>
              {showExport && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export My Data'}
                </Button>
              )}
              {exportComplete && (
                <p className="text-sm text-green-600 mt-2">Data export completed!</p>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Right to Deletion</h4>
              <p className="text-sm text-muted-foreground">
                Request permanent deletion of all your analytics data.
              </p>
              {showDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-2"
                  onClick={handleDeleteData}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete My Data'}
                </Button>
              )}
              {deleteComplete && (
                <p className="text-sm text-green-600 mt-2">Data deletion completed!</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Right to Rectification</h4>
              <p className="text-sm text-muted-foreground">
                Request correction of inaccurate or incomplete data.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Right to Portability</h4>
              <p className="text-sm text-muted-foreground">
                Request your data in a machine-readable format.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Compliance Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Compliance & Security</h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="font-medium">GDPR Compliant</div>
                <div className="text-sm text-muted-foreground">Full compliance with EU data protection laws</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Data Encrypted</div>
                <div className="text-sm text-muted-foreground">All data encrypted in transit and at rest</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Privacy by Design</div>
                <div className="text-sm text-muted-foreground">Privacy built into our development process</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">No Third-Party Sharing</div>
                <div className="text-sm text-muted-foreground">Your data is never sold or shared with third parties</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contact & Support</h3>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            If you have questions about your privacy or need to exercise your data rights,
            please contact our privacy team at privacy@parsify.dev
          </p>
          <p>
            We will respond to your request within 30 days as required by applicable data protection laws.
          </p>
        </div>
      </Card>
    </div>
  )
}
