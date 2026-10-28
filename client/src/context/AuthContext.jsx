import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '../services/authService.js';
import { subscriptionService } from '../services/subscriptionService.js';
import { ApiError } from '../services/api.js';

const AuthContext = createContext(null);

/** Shape used before the first status call resolves. Never grants premium. */
const UNKNOWN_SUBSCRIPTION = {
  plan: 'free',
  isPremium: false,
  label: 'Free',
  premiumSince: null,
  premiumUntil: null,
  source: 'none',
  templates: null,
  billing: {
    providerConfigured: false,
    checkoutConfigured: false,
    devUpgradeEnabled: false,
    upgradePath: 'operator',
    paymentRequired: false,
  },
};

const POLL_INTERVAL_MS = 45_000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ portfolios: 0, published: 0 });
  const [subscription, setSubscription] = useState(UNKNOWN_SUBSCRIPTION);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);
  userRef.current = user;

  const applySession = useCallback((data) => {
    if (data?.user) setUser(data.user);
    if (data?.stats) setStats(data.stats);
    if (data?.subscription) setSubscription((current) => ({ ...current, ...data.subscription }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await authService.me();
      applySession(data);
      return data.user;
    } catch (error) {
      // 401 simply means "not signed in".
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error('[auth] session check failed:', error.message);
      }
      setUser(null);
      setStats({ portfolios: 0, published: 0 });
      setSubscription(UNKNOWN_SUBSCRIPTION);
      return null;
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Re-reads entitlement from the API. Called on a slow poll and whenever the
   * tab regains focus, so a plan that becomes active server-side unlocks the
   * premium catalogue without a reload or a new account.
   */
  const refreshSubscription = useCallback(async () => {
    if (!userRef.current) return null;
    setSubscriptionLoading(true);
    try {
      const data = await subscriptionService.status();
      if (data?.subscription) setSubscription((current) => ({ ...current, ...data.subscription }));
      return data?.subscription || null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSubscription(UNKNOWN_SUBSCRIPTION);
      }
      return null;
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  /**
   * Starts an upgrade for the signed-in user.
   *
   * The server answers with either a hosted checkout URL (activation happens
   * later through the signed billing webhook) or, in development only, an
   * already-activated plan. Either way the entitlement is re-read from the API
   * before this resolves, so the gallery unlocks without a reload or a logout.
   * A 503 `BILLING_NOT_CONFIGURED` rejection is surfaced to the caller as-is —
   * nothing is optimistically granted here.
   */
  const upgrade = useCallback(
    async (interval = 'monthly') => {
      const result = await subscriptionService.checkout(interval);

      if (result?.mode === 'checkout') {
        return { mode: 'checkout', url: result.url, interval };
      }

      if (result?.subscription) {
        setSubscription((current) => ({ ...current, ...result.subscription }));
      }
      if (result?.user) {
        setUser((current) => (current ? { ...current, ...result.user } : result.user));
      }
      // Re-read from the server so the state is the stored one, not the echoed one.
      const confirmed = await refreshSubscription();
      return { mode: 'activated', subscription: confirmed || result.subscription || null, interval };
    },
    [refreshSubscription]
  );

  useEffect(() => {
    if (!user) {
      setSubscription(UNKNOWN_SUBSCRIPTION);
      return undefined;
    }
    refreshSubscription();
    const timer = setInterval(refreshSubscription, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshSubscription();
    };
    window.addEventListener('focus', refreshSubscription);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshSubscription);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, refreshSubscription]);

  const login = useCallback(
    async (credentials) => {
      const data = await authService.login(credentials);
      applySession(data);
      if (data.subscription) setSubscription((current) => ({ ...current, ...data.subscription }));
      authService.me().then(applySession).catch(() => {});
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const data = await authService.register(payload);
      applySession(data);
      setStats({ portfolios: 0, published: 0 });
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStats({ portfolios: 0, published: 0 });
      setSubscription(UNKNOWN_SUBSCRIPTION);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      stats,
      loading,
      login,
      register,
      logout,
      refresh,
      setStats,
      subscription,
      subscriptionLoading,
      isPremium: Boolean(subscription?.isPremium),
      refreshSubscription,
      upgrade,
    }),
    [user, stats, loading, login, register, logout, refresh, subscription, subscriptionLoading, refreshSubscription, upgrade]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
