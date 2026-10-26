import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  LayoutTemplate,
  FolderOpen,
  Gauge,
  Newspaper,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search,
  Plus,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  CircleUserRound,
  LifeBuoy,
} from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { initials } from '../utils/format.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/builder', label: 'AI Builder', icon: Sparkles, badge: 'AI' },
  { to: '/dashboard/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/dashboard/portfolios', label: 'My Portfolios', icon: FolderOpen },
  { to: '/dashboard/analyzer', label: 'Analyzer', icon: Gauge },
  { to: '/dashboard/blog', label: 'Blog', icon: Newspaper },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const BREADCRUMBS = {
  '/dashboard': 'Overview',
  '/dashboard/builder': 'AI Builder',
  '/dashboard/templates': 'Templates',
  '/dashboard/portfolios': 'My Portfolios',
  '/dashboard/analyzer': 'Portfolio Analyzer',
  '/dashboard/blog': 'Blog Studio',
  '/dashboard/settings': 'Settings',
  '/dashboard/create': 'New portfolio',
};

function useClickOutside(onOutside) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onOutside();
    };
    const key = (event) => {
      if (event.key === 'Escape') onOutside();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, [onOutside]);
  return ref;
}

export default function DashboardLayout() {
  const { user, stats, logout } = useAuth();
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [search, setSearch] = useState('');

  const notifRef = useClickOutside(() => setNotifOpen(false));
  const profileRef = useClickOutside(() => setProfileOpen(false));

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
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

  const currentTitle =
    BREADCRUMBS[location.pathname] ||
    (location.pathname.includes('/edit') ? 'Portfolio editor' : location.pathname.includes('/publish') ? 'Published' : 'Workspace');

  const notifications = [
    {
      title: stats?.drafts ? `${stats.drafts} draft${stats.drafts === 1 ? '' : 's'} waiting` : 'No drafts right now',
      body: stats?.drafts ? 'Finish a draft and publish it when you are ready.' : 'Your workspace is up to date.',
      icon: FolderOpen,
      to: '/dashboard/portfolios?status=draft',
    },
    {
      title: 'Run a portfolio analysis',
      body: 'Check completeness, clarity and contactability in under a minute.',
      icon: Gauge,
      to: '/dashboard/analyzer',
    },
    {
      title: 'Browse new templates',
      body: 'Nine design systems, ready to preview with sample content.',
      icon: LayoutTemplate,
      to: '/dashboard/templates',
    },
  ];

  const sidebarWidth = collapsed ? 'lg:w-[84px]' : 'lg:w-[264px]';

  const NavItems = ({ onNavigate }) => (
    <nav aria-label="Dashboard navigation" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          title={collapsed ? label : undefined}
        >
          <Icon size={18} className="shrink-0" aria-hidden="true" />
          <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
          {badge && !collapsed ? (
            <span className="ml-auto rounded-full bg-brand-gradient px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              {badge}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-raised"
      >
        Skip to content
      </a>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-[#020617]/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col border-r border-white/[0.07] bg-[#070c1a]/98 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarWidth} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`flex h-16 items-center border-b border-white/[0.07] px-4 ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
          <div className={collapsed ? 'lg:hidden' : ''}>
            <Logo />
          </div>
          <div className={`hidden ${collapsed ? 'lg:block' : ''}`}>
            <Logo withWordmark={false} />
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} className="btn-ghost h-8 w-8 p-0 lg:hidden" aria-label="Close navigation">
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 scroll-slim">
          <div className={`mb-4 ${collapsed ? 'lg:hidden' : ''}`}>
            <button type="button" onClick={() => navigate('/dashboard/builder')} className="btn-primary w-full justify-center">
              <Plus size={15} aria-hidden="true" />
              New portfolio
            </button>
          </div>
          {collapsed ? (
            <div className="mb-3 hidden justify-center lg:flex">
              <button type="button" onClick={() => navigate('/dashboard/builder')} className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white" aria-label="New portfolio" title="New portfolio">
                <Plus size={17} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <NavItems onNavigate={() => setMobileOpen(false)} />

          <div className={`mt-6 border-t border-white/[0.07] pt-4 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-accent-soft to-transparent p-4">
              <Sparkles size={16} className="text-accent-hover" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-white">AI builder tips</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Specific numbers and outcomes make AI-written summaries far stronger.
              </p>
              <button type="button" onClick={() => navigate('/dashboard/builder')} className="btn-secondary btn-sm mt-3 w-full justify-center">
                Open builder
              </button>
            </div>
          </div>

          <div className={`mt-4 ${collapsed ? 'lg:hidden' : ''}`}>
            <a
              href="/#faq"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-faint transition-colors hover:text-ink"
            >
              <LifeBuoy size={14} aria-hidden="true" />
              Help & documentation
            </a>
          </div>
        </div>

        <div className={`border-t border-white/[0.07] p-3 ${collapsed ? 'lg:px-2' : ''}`}>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={`hidden w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-white/[0.05] hover:text-ink lg:flex ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
            <span className={collapsed ? 'lg:hidden' : ''}>Collapse</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]'}`}>
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#070b18]/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="btn-ghost h-9 w-9 p-0 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              <Menu size={19} aria-hidden="true" />
            </button>

            <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
              <span className="text-faint">Workspace</span>
              <ChevronRight size={13} className="text-faint/60" aria-hidden="true" />
              <span className="truncate font-medium text-ink">{currentTitle}</span>
            </div>

            <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 items-center sm:flex" role="search">
              <div className="relative w-full">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search portfolios…"
                  aria-label="Search portfolios"
                  className="input h-9 rounded-lg py-1.5 pl-9 text-xs"
                />
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1.5 sm:ml-2">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((value) => !value)}
                  className="btn-ghost relative h-9 w-9 rounded-lg p-0"
                  aria-label="Notifications"
                  aria-expanded={notifOpen}
                >
                  <Bell size={17} aria-hidden="true" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-hover" aria-hidden="true" />
                </button>
                {notifOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-[320px] overflow-hidden rounded-xl border border-lineStrong bg-surface shadow-float animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <p className="text-sm font-semibold text-white">Workspace updates</p>
                      <span className="text-2xs text-faint">Live from your account</span>
                    </div>
                    <ul className="divide-y divide-line">
                      {notifications.map(({ title, body, icon: Icon, to }) => (
                        <li key={title}>
                          <NavLink to={to} className="flex gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-accent-hover">
                              <Icon size={14} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-ink">{title}</p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{body}</p>
                            </div>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.06]"
                  aria-expanded={profileOpen}
                  aria-label="Account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
                    {initials(user?.name)}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs font-medium text-ink sm:block">{user?.name}</span>
                  <ChevronRight size={13} className={`hidden text-faint transition-transform sm:block ${profileOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-lineStrong bg-surface shadow-float animate-fadeIn">
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                      <p className="truncate text-xs text-muted">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <NavLink to="/dashboard/settings" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-inkSoft transition-colors hover:bg-white/[0.06] hover:text-white">
                        <CircleUserRound size={14} aria-hidden="true" />
                        Profile & settings
                      </NavLink>
                      <NavLink to="/dashboard/portfolios" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-inkSoft transition-colors hover:bg-white/[0.06] hover:text-white">
                        <FolderOpen size={14} aria-hidden="true" />
                        My portfolios
                      </NavLink>
                      <a href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-inkSoft transition-colors hover:bg-white/[0.06] hover:text-white">
                        <ExternalLink size={14} aria-hidden="true" />
                        Public site
                      </a>
                    </div>
                    <div className="border-t border-line p-1.5">
                      <button
                        type="button"
                        onClick={onLogout}
                        disabled={signingOut}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
                      >
                        <LogOut size={14} aria-hidden="true" />
                        {signingOut ? 'Signing out…' : 'Sign out'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-white/[0.06] px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-2 text-2xs text-faint">
            <p>© {new Date().getFullYear()} PortiAI · Portfolio workspace</p>
            <div className="flex items-center gap-4">
              <NavLink to="/privacy" className="transition-colors hover:text-ink">Privacy</NavLink>
              <NavLink to="/terms" className="transition-colors hover:text-ink">Terms</NavLink>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                Synced with PortiAI API
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
