import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../ui/Primitives.jsx';
import { adminRedirectFor, resolveAdminAccess } from '../../utils/adminAccess.js';

/**
 * Guards every /admin/* page. Anonymous visitors go to /admin/login;
 * signed-in non-admins are sent back to their own dashboard. The API
 * enforces the same rule server-side — this only controls navigation.
 */
export default function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const access = resolveAdminAccess({ user, loading });

  if (access === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Checking access…" />
      </div>
    );
  }

  if (access === 'login') {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (access === 'forbidden') {
    return <Navigate to={adminRedirectFor(access)} replace />;
  }

  return <Outlet />;
}
