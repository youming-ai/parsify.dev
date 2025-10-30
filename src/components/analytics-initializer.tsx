/**
 * Analytics Initializer Component
 * Initializes analytics services with proper error handling
 */

'use client';

import { useSimplifiedAnalytics } from '@/lib/analytics/simplified';
import { useEffect } from 'react';

interface AnalyticsInitializerProps {
	children: React.ReactNode;
}

export function AnalyticsInitializer({ children }: AnalyticsInitializerProps) {
	const { isReady, trackPageView } = useSimplifiedAnalytics({
		enableClarity: !!process.env.NEXT_PUBLIC_MICROSOFT_CLARITY_ID,
		enableCloudflare: true,
		debugMode: process.env.NODE_ENV === 'development',
	});

	useEffect(() => {
		if (isReady) {
			// Track initial page view
			trackPageView();
		}
	}, [isReady, trackPageView]);

	// Render children immediately - analytics loads in background
	return <>{children}</>;
}
