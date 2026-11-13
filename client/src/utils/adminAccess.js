/**
 * Pure helpers for the admin area. Kept free of React so the access rules
 * can be unit-tested without a DOM.
 *
 * The frontend only decides where to send the browser; the real security
 * boundary is the API, which rejects non-admin sessions with 403.
 */

export const ADMIN_LOGIN_PATH = '/admin/login';
export const ADMIN_DASHBOARD_PATH = '/admin/dashboard';
export const USER_DASHBOARD_PATH = '/dashboard';

/** 'loading' | 'login' | 'admin' | 'forbidden' */
export const resolveAdminAccess = ({ user, loading }) => {
  if (loading) return 'loading';
  if (!user) return 'login';
  if (user.isAdmin) return 'admin';
  return 'forbidden';
};

/** Where the router should send each access state. */
export const adminRedirectFor = (access) => {
  if (access === 'login') return ADMIN_LOGIN_PATH;
  if (access === 'forbidden') return USER_DASHBOARD_PATH;
  return null;
};

export const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Overview', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/portfolios', label: 'Portfolios' },
  { to: '/admin/ai-builder', label: 'AI Project Builder' },
  { to: '/admin/subscriptions', label: 'Subscriptions' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/blog', label: 'Blog Management' },
  { to: '/admin/templates', label: 'Templates' },
  { to: '/admin/analytics', label: 'AI Usage & Analytics' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/settings', label: 'Settings' },
];
