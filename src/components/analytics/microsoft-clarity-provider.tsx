"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { getMicrosoftClarityService } from "@/lib/analytics/clarity";

interface MicrosoftClarityProviderProps {
  children: React.ReactNode;
  projectId?: string;
  enabled?: boolean;
  debug?: boolean;
}

interface MicrosoftClarityProviderInnerProps {
  projectId?: string;
  enabled?: boolean;
  debug?: boolean;
}

/**
 * Microsoft Clarity Analytics Provider Inner Component
 * Handles Microsoft Clarity initialization and page view tracking
 */
function MicrosoftClarityProviderInner({
  projectId,
  enabled,
  debug,
}: MicrosoftClarityProviderInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window === "undefined") return;

    // Initialize Microsoft Clarity
    const initializeClarity = async () => {
      try {
        const clarityService = getMicrosoftClarityService();

        // Update configuration if provided
        if (projectId || enabled !== undefined || debug !== undefined) {
          clarityService.updateConfig({
            projectId: projectId || process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID || "tx90x0sxzq",
            enabled: enabled ?? process.env.NODE_ENV !== "development",
            debug: debug ?? process.env.NODE_ENV === "development",
          });
        }

        // Initialize the service
        await clarityService.initialize();
      } catch (error) {
        console.error("Failed to initialize Microsoft Clarity:", error);
      }
    };

    initializeClarity();
  }, [projectId, enabled, debug]);

  // Track page views when pathname or search params change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const trackPageView = () => {
      try {
        const clarityService = getMicrosoftClarityService();

        if (clarityService.isReady()) {
          const fullPath = searchParams.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;

          clarityService.trackPageView(fullPath);
        }
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    };

    // Small delay to ensure the page title is updated
    const timeoutId = setTimeout(trackPageView, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, searchParams]);

  return null;
}

/**
 * Microsoft Clarity Analytics Provider
 * Wraps the provider in Suspense boundary for Next.js 16 compatibility
 */
export function MicrosoftClarityProvider({
  children,
  projectId,
  enabled,
  debug,
}: MicrosoftClarityProviderProps) {
  return (
    <>
      <Suspense fallback={null}>
        <MicrosoftClarityProviderInner projectId={projectId} enabled={enabled} debug={debug} />
      </Suspense>
      {children}
    </>
  );
}
