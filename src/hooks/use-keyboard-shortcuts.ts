'use client';

import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const eventKey = event.key.toLowerCase();

      for (const shortcut of shortcuts) {
        const shortcutKey = shortcut.key.toLowerCase();
        if (eventKey !== shortcutKey) {
          continue;
        }

        const requiresCtrl = shortcut.ctrl ?? false;
        const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
        if (requiresCtrl !== hasCtrlOrMeta) {
          continue;
        }

        const requiresShift = shortcut.shift ?? false;
        if (requiresShift !== event.shiftKey) {
          continue;
        }

        if (shortcut.meta !== undefined && shortcut.meta !== event.metaKey) {
          continue;
        }

        event.preventDefault();
        shortcut.handler();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}
