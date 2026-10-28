import { useCallback, useEffect, useState } from 'react';
import { subscriptionService } from '../services/subscriptionService.js';

/**
 * Public pricing for the Premium page and upgrade dialog.
 *
 * The amounts live on the server (`server/src/config/pricing.js`) and are read
 * from `GET /api/subscription/plans`, which needs no session. The response is
 * cached for the tab so navigating between the gallery and the Premium page
 * does not refetch, and there is no client-side copy of any price.
 */
let cache = null;
let pending = null;

const load = () => {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = subscriptionService
      .plans()
      .then((data) => {
        cache = data;
        pending = null;
        return data;
      })
      .catch((error) => {
        pending = null;
        throw error;
      });
  }
  return pending;
};

export default function usePricing() {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    cache = null;
    setLoading(true);
    return load()
      .then((next) => {
        setData(next);
        setError(null);
        return next;
      })
      .catch((err) => {
        setError(err);
        return null;
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let alive = true;
    load()
      .then((next) => {
        if (alive) {
          setData(next);
          setError(null);
        }
      })
      .catch((err) => {
        if (alive) setError(err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return {
    pricing: data?.pricing || null,
    plans: data?.plans || [],
    billing: data?.billing || null,
    loading,
    error,
    refresh,
  };
}
