import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Newspaper,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { initials } from '../../utils/format.js';
import { ADMIN_NAV } from '../../utils/adminAccess.js';

const ICONS = {
  '/admin/dashboard': LayoutDashboard,
  '/admin/users': Users,
  '/admin/portfolios': FolderOpen,
  '/admin/ai-builder': Wand2,
  '/admin/subscriptions': ShieldCheck,
  '/admin/payments': FileText,
  '/admin/blog': Newspaper,
  '/admin/templates': LayoutTemplate,
  '/admin/analytics': BarChart3,
  '/admin/reports': FileText,
  '/admin/settings': Settings,
};

const TITLES = Object.fromEntries(ADMIN_NAV.map((item) => [item.to, item.label]));

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const onLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast.success('Signed out of the admin panel.');
      navigate('/admin/login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Could not sign out. Try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const title = TITLES[location.pathname] || 'Admin';

  const navItems = (onNavigate) => (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {ADMIN_NAV.map(({ to, label, end }) => {
        const Icon = ICONS[to] || LayoutDashboard;
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md border-l-2 py-2 pl-2 pr-2.5 text-[13px] font-medium transition-colors ${
                isActive
                  ? 'border-accent bg-accent-soft text-accent-hover'
                  : 'border-transparent text-muted hover:bg-surfaceRaised hover:text-ink'
              }`
            }
          >
            <Icon size={16} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-raised"
      >
        Skip to content
      </a>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-overlay lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-3">
          <Logo />
          <button type="button" onClick={() => setMobileOpen(false)} className="btn-ghost h-8 w-8 p-0 lg:hidden" aria-label="Close navigation">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-3 scroll-slim">
          <p className="mb-2 flex items-center gap-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint">
            <Sparkles size={11} aria-hidden="true" />
            Administration
          </p>
          {navItems(() => setMobileOpen(false))}

          <div className="mt-5 border-t border-line pt-3">
            <NavLink to="/dashboard" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] text-faint transition-colors hover:text-ink">
              <LayoutDashboard size={12} aria-hidden="true" />
              User dashboard
            </NavLink>
          </div>
        </div>

        <div className="border-t border-line p-2">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-contrast">
              {initials(user?.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-medium text-ink">{user?.name}</span>
              <span className="block truncate text-[10.5px] text-faint">{user?.email}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={signingOut}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-dangerSoft"
          >
            <LogOut size={14} aria-hidden="true" />
            {signingOut ? 'Signing out…' : 'Logout'}
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button type="button" onClick={() => setMobileOpen(true)} className="btn-ghost h-8 w-8 p-0 lg:hidden" aria-label="Open navigation">
              <Menu size={16} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
              <p className="hidden text-[11px] text-faint sm:block">PortiAI administration</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-accent-hover sm:inline-flex">
                <ShieldCheck size={11} aria-hidden="true" />
                Admin
              </span>
              <ThemeToggle size="sm" />
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        <footer className="border-t border-line px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 text-[11px] text-faint">
            <p>© {new Date().getFullYear()} PortiAI Admin</p>
            <p>All actions are verified on the server and recorded in the audit log.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
