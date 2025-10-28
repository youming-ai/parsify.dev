'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getMicrosoftClarityService } from '@/lib/analytics/clarity'

interface MicrosoftClarityProviderProps {
  children: React.ReactNode
  projectId?: string
  enabled?: boolean
  debug?: boolean
}

/**
 * Microsoft Clarity Analytics Provider
 * Handles Microsoft Clarity initialization and page view tracking
 */
export function MicrosoftClarityProvider({
  children,
  projectId,
  enabled,
  debug,
}: MicrosoftClarityProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window === 'undefined') return

    // Initialize Microsoft Clarity
    const initializeClarity = async () => {
      try {
        const clarityService = getMicrosoftClarityService()

        // Update configuration if provided
        if (projectId || enabled !== undefined || debug !== undefined) {
          clarityService.updateConfig({
            projectId: projectId || process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID || 'tx90x0sxzq',
            enabled: enabled ?? process.env.NODE_ENV !== 'development',
            debug: debug ?? process.env.NODE_ENV === 'development',
          })
        }

        // Initialize the service
        await clarityService.initialize()
      } catch (error) {
        console.error('Failed to initialize Microsoft Clarity:', error)
      }
    }

    initializeClarity()
  }, [projectId, enabled, debug])

  // Track page views when pathname or search params change
  useEffect(() => {
    if (typeof window === 'undefined') return

    const trackPageView = () => {
      try {
        const clarityService = getMicrosoftClarityService()

        if (clarityService.isReady()) {
          const fullPath = searchParams.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname

          clarityService.trackPageView(fullPath)
        }
      } catch (error) {
        console.error('Failed to track page view:', error)
      }
    }

    // Small delay to ensure the page title is updated
    const timeoutId = setTimeout(trackPageView, 100)

    return () => clearTimeout(timeoutId)
  }, [pathname, searchParams])

  return <>{children}</>
}
