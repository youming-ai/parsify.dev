'use client';

import { useEffect } from 'react';

interface ClarityProps {
  projectId: string;
}

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export function Clarity({ projectId }: ClarityProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !projectId) return;

    // Microsoft Clarity script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${projectId}`;

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Initialize Clarity
    if (typeof window.clarity === 'function') {
      window.clarity('start', projectId);
    }
  }, [projectId]);

  return null;
}
