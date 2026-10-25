import { useEffect } from 'react';

/**
 * Warns before the tab is closed or reloaded while there are unsaved changes.
 * (In-app navigation is guarded explicitly by the screens that own the draft.)
 */
export default function useUnsavedWarning(dirty) {
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
