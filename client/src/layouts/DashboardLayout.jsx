import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  CircleUserRound,
  ExternalLink,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { initials } from '../utils/format.js';
import useAiStatus from '../hooks/useAiStatus.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/builder', label: 'AI Builder', icon: Sparkles },
  { to: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/dashboard/portfolios', label: 'My Portfolios', icon: FolderOpen },
  { to: '/dashboard/analyzer', label: 'Analyzer', icon: Gauge },
  { to: '/dashboard/blog', label: 'Blog', icon: Newspaper },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/builder': 'AI Builder',
  '/dashboard/templates': 'Templates',
  '/dashboard/portfolios': 'My Portfolios',
  '/dashboard/analyzer': 'Analyzer',
  '/dashboard/blog': 'Blog',
  '/dashboard/settings': 'Settings',
  '/dashboard/create': 'New portfolio',
};

function useClickOutside(onOutside) {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onOutside();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') onOutside();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onOutside]);
  return ref;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('portiai.sidebar') === 'collapsed';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [search, setSearch] = useState('');

  const [statusOpen, setStatusOpen] = useState(false);
  const { status: aiStatus, reload: reloadAiStatus } = useAiStatus();

  const profileRef = useClickOutside(() => setProfileOpen(false));
  const statusRef = useClickOutside(() => setStatusOpen(false));

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
    setStatusOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem('portiai.sidebar', collapsed ? 'collapsed' : 'expanded');
    } catch {
      /* storage may be unavailable */
    }
  }, [collapsed]);

  const onLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast.success('Signed out.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Could not sign out. Try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (!search.trim()) return;
    navigate(`/dashboard/portfolios?q=${encodeURIComponent(search.trim())}`);
    setSearch('');
  };

  const path = location.pathname;
  const title =
    TITLES[path] ||
    (path.endsWith('/analyze')
      ? 'Analyzer'
      : path.includes('/edit')
        ? 'Portfolio editor'
        : path.includes('/publish')
          ? 'Published'
          : path.startsWith('/dashboard/blog/')
            ? 'Blog post'
            : 'Workspace');

  // Nested routes (editor, publish, per-portfolio analysis) highlight their parent section.
  const parentSection = path.endsWith('/analyze')
    ? '/dashboard/analyzer'
    : path.startsWith('/dashboard/portfolio/') || path.startsWith('/dashboard/publish/')
      ? '/dashboard/portfolios'
      : null;

  const navItems = (onNavigate) => (
    <nav aria-label="Workspace" className="flex flex-col gap-1.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            `sidebar-link ${isActive || parentSection === to ? 'sidebar-link-active' : ''} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
          }
        >
          {({ isActive: routeActive }) => {
            const isActive = routeActive || parentSection === to;
            return (
            <>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] transition-colors ${
                  isActive ? 'bg-accent text-white shadow-neu-accent' : ''
                }`}
              >
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
            </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );

  // Header status: built only from /api/ai/status (real server configuration
  // and today's usage). Nothing is shown until the request has answered.
  const usage = aiStatus?.usage;
  const aiAttention = aiStatus ? !aiStatus.configured || (usage && usage.remaining === 0) : false;

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-neu"
      >
        Skip to content
      </a>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-[#1b2559]/25 animate-fadeIn lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      ) : null}

      {/* Sidebar: a raised panel floating on the page tone. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col p-3 transition-transform duration-200 lg:translate-x-0 ${
          collapsed ? 'lg:w-[92px]' : ''
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-full flex-col rounded-[24px] bg-surface shadow-neu">
          <div className={`flex h-16 items-center px-4 ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
            <div className={collapsed ? 'lg:hidden' : ''}>
              <Logo />
            </div>
            <div className={`hidden ${collapsed ? 'lg:block' : ''}`}>
              <Logo withWordmark={false} />
            </div>
            <button type="button" onClick={() => setMobileOpen(false)} className="icon-btn h-8 w-8 lg:hidden" aria-label="Close navigation">
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 pt-1 scroll-slim">
            <div className={`mb-4 ${collapsed ? 'lg:hidden' : ''}`}>
              <button type="button" onClick={() => navigate('/dashboard/create')} className="btn-primary w-full justify-center">
                <Plus size={15} aria-hidden="true" />
                New portfolio
              </button>
            </div>
            {collapsed ? (
              <div className="mb-4 hidden justify-center lg:flex">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/create')}
                  className="btn-primary h-10 w-10 p-0"
                  aria-label="New portfolio"
                  title="New portfolio"
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              </div>
            ) : null}

            <p className={`mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint ${collapsed ? 'lg:hidden' : ''}`}>
              Workspace
            </p>
            {navItems(() => setMobileOpen(false))}

            <div className={`mt-6 space-y-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">Resources</p>
              <Link to="/features" className="flex items-center gap-2.5 rounded-control px-3 py-2 text-[12.5px] text-muted transition-colors hover:text-ink">
                <Settings size={13} aria-hidden="true" />
                Features &amp; limits
              </Link>
              <a href="/" className="flex items-center gap-2.5 rounded-control px-3 py-2 text-[12.5px] text-muted transition-colors hover:text-ink">
                <ExternalLink size={13} aria-hidden="true" />
                Public site
              </a>
            </div>
          </div>

          <div className="p-3">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className={`hidden w-full items-center gap-2 rounded-control bg-canvas px-3 py-2 text-[12px] font-medium text-muted shadow-neu-inset-sm transition-colors hover:text-ink lg:flex ${
                collapsed ? 'justify-center px-0' : ''
              }`}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={14} aria-hidden="true" /> : <PanelLeftClose size={14} aria-hidden="true" />}
              <span className={collapsed ? 'lg:hidden' : ''}>Collapse</span>
            </button>
          </div>
        </div>
      </aside>

      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? 'lg:pl-[92px]' : 'lg:pl-[264px]'}`}>
        <header className="sticky top-0 z-30 bg-canvas/95 px-3 pt-3 sm:px-5 lg:pl-3">
          <div className="flex h-14 items-center gap-3 rounded-[18px] bg-surface px-3 shadow-neu-sm sm:px-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="icon-btn h-9 w-9 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              <Menu size={17} aria-hidden="true" />
            </button>

            <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <span className="hidden text-faint sm:inline">Workspace</span>
              <ChevronRight size={12} className="hidden text-faint sm:inline" aria-hidden="true" />
              <span className="truncate font-semibold text-ink">{title}</span>
            </div>

            <form onSubmit={submitSearch} className="ml-auto hidden max-w-[300px] flex-1 items-center md:flex" role="search">
              <div className="relative w-full">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search portfolios"
                  aria-label="Search portfolios"
                  className="input h-10 rounded-[12px] py-1.5 pl-10 text-[13px]"
                />
              </div>
            </form>

            <div className="relative ml-auto md:ml-1" ref={statusRef}>
              <button
                type="button"
                onClick={() => {
                  setStatusOpen((value) => !value);
                  if (!statusOpen) reloadAiStatus();
                }}
                className={`icon-btn relative h-10 w-10 ${statusOpen ? 'icon-btn-active' : ''}`}
                aria-expanded={statusOpen}
                aria-haspopup="dialog"
                aria-label={aiAttention ? 'Workspace status (needs attention)' : 'Workspace status'}
              >
                <Bell size={16} aria-hidden="true" />
                {aiAttention ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-warning ring-2 ring-surface" aria-hidden="true" />
                ) : null}
              </button>

              {statusOpen ? (
                <div role="dialog" aria-label="Workspace status" className="menu-surface absolute right-0 top-full z-50 mt-3 w-[300px] animate-fadeIn p-4">
                  <p className="text-[13px] font-semibold text-ink">Workspace status</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">Live from the PortiAI server.</p>
                  {aiStatus ? (
                    <div className="mt-3 space-y-2.5">
                      <div className="neu-inset-sm flex items-start gap-2.5 p-3">
                        <Sparkles size={14} className={`mt-0.5 shrink-0 ${aiStatus.configured ? 'text-success' : 'text-warning'}`} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-medium text-ink">
                            {aiStatus.configured ? 'AI writing is available' : 'AI writing is not configured'}
                          </p>
                          <p className="mt-0.5 text-[11.5px] leading-5 text-muted">
                            {aiStatus.configured
                              ? 'Drafting, rewriting and AI feedback can be used.'
                              : 'Editing, previews, rule-based analysis and publishing still work.'}
                          </p>
                        </div>
                      </div>
                      {usage ? (
                        <div className="neu-inset-sm p-3">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="font-medium text-ink">AI requests today</span>
                            <span className="font-mono text-[11.5px] text-muted">
                              {usage.used}/{usage.limit}
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas shadow-neu-inset-xs">
                            <div
                              className={`h-full rounded-full ${usage.remaining === 0 ? 'bg-warning' : 'bg-accent'}`}
                              style={{ width: `${Math.min(100, Math.round((usage.used / (usage.limit || 1)) * 100))}%` }}
                            />
                          </div>
                          <p className="mt-1.5 text-[11px] text-faint">Resets at midnight UTC.</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="neu-inset-sm mt-3 p-3 text-[12px] text-muted">Status is unavailable right now.</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="relative flex items-center" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className={`flex h-10 items-center gap-2 rounded-[12px] bg-surface py-1 pl-1 pr-2 shadow-neu-xs transition-[box-shadow] hover:shadow-neu-sm ${
                  profileOpen ? '!shadow-neu-inset-sm' : ''
                }`}
                aria-expanded={profileOpen}
                aria-label="Account menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent text-[11px] font-semibold text-white">
                  {initials(user?.name)}
                </span>
                <span className="hidden max-w-[120px] truncate text-[12.5px] font-medium text-ink sm:block">{user?.name}</span>
                <ChevronRight size={12} className={`hidden text-faint transition-transform sm:block ${profileOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
              </button>

              {profileOpen ? (
                <div className="menu-surface absolute right-0 top-full z-50 mt-3 w-64 animate-fadeIn">
                  <div className="flex items-center gap-3 px-4 pb-3 pt-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-accent text-[12px] font-semibold text-white shadow-neu-accent">
                      {initials(user?.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{user?.name}</p>
                      <p className="truncate text-[11.5px] text-muted">{user?.email}</p>
                    </div>
                  </div>
                  <div className="mx-3 h-px bg-line" />
                  <div className="space-y-0.5 p-2">
                    <NavLink to="/dashboard/settings" className="menu-item">
                      <CircleUserRound size={14} aria-hidden="true" />
                      Profile &amp; settings
                    </NavLink>
                    <NavLink to="/dashboard/portfolios" className="menu-item">
                      <FolderOpen size={14} aria-hidden="true" />
                      My portfolios
                    </NavLink>
                    <a href="/" className="menu-item">
                      <ExternalLink size={14} aria-hidden="true" />
                      Public site
                    </a>
                  </div>
                  <div className="mx-3 h-px bg-line" />
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={signingOut}
                      className="menu-item !text-danger hover:!bg-dangerSoft disabled:opacity-60"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      {signingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1260px] flex-1 px-4 py-7 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="px-4 pb-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1260px] flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[11.5px] text-faint">
            <p>© {new Date().getFullYear()} PortiAI</p>
            <div className="flex items-center gap-4">
              <NavLink to="/privacy" className="transition-colors hover:text-ink">Privacy</NavLink>
              <NavLink to="/terms" className="transition-colors hover:text-ink">Terms</NavLink>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
