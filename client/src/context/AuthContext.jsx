import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService.js';
import { ApiError } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ portfolios: 0, published: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await authService.me();
      setUser(data.user);
      setStats(data.stats);
      return data.user;
    } catch (error) {
      // 401 simply means "not signed in".
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error('[auth] session check failed:', error.message);
      }
      setUser(null);
      setStats({ portfolios: 0, published: 0 });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    authService.me().then((me) => setStats(me.stats)).catch(() => {});
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authService.register(payload);
    setUser(data.user);
    setStats({ portfolios: 0, published: 0 });
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStats({ portfolios: 0, published: 0 });
    }
  }, []);

  const value = useMemo(
    () => ({ user, stats, loading, login, register, logout, refresh, setStats }),
    [user, stats, loading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
