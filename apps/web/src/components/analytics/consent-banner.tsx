/**
 * Analytics Consent Banner Component
 * Provides GDPR-compliant consent management for analytics
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAnalyticsConsent } from '@/lib/analytics/hooks'
import { CONSENT_LEVELS } from '@/lib/analytics/config'

export function AnalyticsConsentBanner() {
  const {
    consent,
    grantAllConsent,
    revokeAllConsent,
    updateAnalyticsConsent,
    updatePerformanceConsent,
    updateInteractionConsent,
  } = useAnalyticsConsent()
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // Show banner if no consent has been given
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000) // Show after 1 second
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [consent])

  const handleAcceptAll = () => {
    grantAllConsent()
    setIsVisible(false)
    setHasInteracted(true)
  }

  const handleAcceptNecessary = () => {
    revokeAllConsent()
    setIsVisible(false)
    setHasInteracted(true)
  }

  const handleSavePreferences = () => {
    setIsVisible(false)
    setHasInteracted(true)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setHasInteracted(true)
  }

  if (!isVisible || (hasInteracted && consent)) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 shadow-lg">
          <div className="flex flex-col gap-4">
            {/* Main consent message */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Privacy & Analytics</h3>
                <Badge variant="secondary">GDPR Compliant</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                We use analytics to understand how you use our tools and improve
                your experience. Your data is anonymized and never shared with
                third parties. You can change your preferences at any time.
              </p>
            </div>

            {/* Detailed consent options */}
            {showDetails && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="grid gap-4">
                  {/* Analytics Consent */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label
                        htmlFor="analytics-consent"
                        className="font-medium"
                      >
                        Analytics & Usage Data
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Track how you use our tools and features to improve the
                        service
                      </p>
                    </div>
                    <Switch
                      id="analytics-consent"
                      checked={consent?.analytics ?? false}
                      onCheckedChange={updateAnalyticsConsent}
                    />
                  </div>

                  {/* Performance Consent */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label
                        htmlFor="performance-consent"
                        className="font-medium"
                      >
                        Performance Monitoring
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Monitor page load times and performance to optimize
                        speed
                      </p>
                    </div>
                    <Switch
                      id="performance-consent"
                      checked={consent?.performance ?? false}
                      onCheckedChange={updatePerformanceConsent}
                    />
                  </div>

                  {/* Interaction Consent */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label
                        htmlFor="interaction-consent"
                        className="font-medium"
                      >
                        User Interactions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Track clicks, scrolls, and interactions to improve user
                        experience
                      </p>
                    </div>
                    <Switch
                      id="interaction-consent"
                      checked={consent?.interactions ?? false}
                      onCheckedChange={updateInteractionConsent}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-4">
              {!showDetails ? (
                <>
                  <Button onClick={handleAcceptAll} className="flex-1">
                    Accept All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAcceptNecessary}
                    className="flex-1"
                  >
                    Only Necessary
                  </Button>
                  <Button variant="ghost" onClick={() => setShowDetails(true)}>
                    Customize
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleSavePreferences} className="flex-1">
                    Save Preferences
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={handleDismiss} size="sm">
                Maybe Later
              </Button>
            </div>

            {/* Additional information */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>🔒 Data encrypted</span>
                <span>🌍 GDPR compliant</span>
                <span>📊 No third-party sharing</span>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                Privacy Policy
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

/**
 * Small consent widget that appears when user wants to change preferences
 */
export function ConsentWidget() {
  const [isVisible, setIsVisible] = useState(false)
  const {
    consent,
    updateAnalyticsConsent,
    updatePerformanceConsent,
    updateInteractionConsent,
  } = useAnalyticsConsent()

  if (!consent || isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="text-xs bg-background/95 backdrop-blur-sm"
      >
        📊 Analytics Settings
      </Button>
    </div>
  )
}

/**
 * Full consent management modal
 */
export function ConsentModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const {
    consent,
    grantAllConsent,
    revokeAllConsent,
    updateAnalyticsConsent,
    updatePerformanceConsent,
    updateInteractionConsent,
  } = useAnalyticsConsent()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Analytics Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Manage your analytics and privacy preferences
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="modal-analytics-consent"
                  className="font-medium"
                >
                  Analytics & Usage Data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Track tool usage and feature interactions
                </p>
              </div>
              <Switch
                id="modal-analytics-consent"
                checked={consent?.analytics ?? false}
                onCheckedChange={updateAnalyticsConsent}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="modal-performance-consent"
                  className="font-medium"
                >
                  Performance Monitoring
                </Label>
                <p className="text-xs text-muted-foreground">
                  Monitor page load times and performance
                </p>
              </div>
              <Switch
                id="modal-performance-consent"
                checked={consent?.performance ?? false}
                onCheckedChange={updatePerformanceConsent}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="modal-interaction-consent"
                  className="font-medium"
                >
                  User Interactions
                </Label>
                <p className="text-xs text-muted-foreground">
                  Track clicks, scrolls, and interactions
                </p>
              </div>
              <Switch
                id="modal-interaction-consent"
                checked={consent?.interactions ?? false}
                onCheckedChange={updateInteractionConsent}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} className="flex-1">
            Save & Close
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          You can change these preferences at any time
        </div>
      </Card>
    </div>
  )
}
