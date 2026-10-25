import { useCallback, useEffect, useState } from 'react';
import { aiService } from '../services/portfolioService.js';

/**
 * Loads /api/ai/status (whether Gemini is configured, plus today's usage).
 * Returns null while unknown so the UI can stay silent instead of guessing.
 */
export default function useAiStatus() {
  const [status, setStatus] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await aiService.status();
      setStatus(data);
      return data;
    } catch {
      setStatus(null);
      return null;
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { status, reload, setStatus };
}
