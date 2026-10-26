import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
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

  const profileRef = useClickOutside(() => setProfileOpen(false));

  useEffect(() => {
    setMobileOpen(false);
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

  const title =
    TITLES[location.pathname] ||
    (location.pathname.includes('/edit') ? 'Portfolio editor' : location.pathname.includes('/publish') ? 'Published' : 'Workspace');

  const navItems = (onNavigate) => (
    <nav aria-label="Workspace" className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors ${
              isActive ? 'bg-accent text-white' : 'text-muted hover:bg-surfaceRaised hover:text-ink'
            } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
          }
        >
          <Icon size={16} className="shrink-0" aria-hidden="true" />
          <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
        </NavLink>
      ))}
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
        <div className="fixed inset-0 z-40 bg-ink/25 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0 ${
          collapsed ? 'lg:w-[68px]' : ''
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex h-14 items-center border-b border-line px-3 ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}>
          <div className={collapsed ? 'lg:hidden' : ''}>
            <Logo />
          </div>
          <div className={`hidden ${collapsed ? 'lg:block' : ''}`}>
            <Logo withWordmark={false} />
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} className="btn-ghost h-8 w-8 p-0 lg:hidden" aria-label="Close navigation">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-3 scroll-slim">
          <div className={`mb-3 ${collapsed ? 'lg:hidden' : ''}`}>
            <button type="button" onClick={() => navigate('/dashboard/create')} className="btn-primary btn-sm w-full justify-center">
              <Plus size={13} aria-hidden="true" />
              New portfolio
            </button>
          </div>
          {collapsed ? (
            <div className="mb-2 hidden justify-center lg:flex">
              <button
                type="button"
                onClick={() => navigate('/dashboard/create')}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white"
                aria-label="New portfolio"
                title="New portfolio"
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {navItems(() => setMobileOpen(false))}

          <div className={`mt-5 border-t border-line pt-3 ${collapsed ? 'lg:hidden' : ''}`}>
            <Link to="/features" className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] text-faint transition-colors hover:text-ink">
              <Settings size={12} aria-hidden="true" />
              Features &amp; limits
            </Link>
            <a href="/" className="mt-0.5 flex items-center gap-2 rounded-md px-2.5 py-2 text-[12px] text-faint transition-colors hover:text-ink">
              <ExternalLink size={12} aria-hidden="true" />
              Public site
            </a>
          </div>
        </div>

        <div className={`border-t border-line p-2 ${collapsed ? 'lg:px-1.5' : ''}`}>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={`hidden w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-faint transition-colors hover:bg-surfaceRaised hover:text-ink lg:flex ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={14} aria-hidden="true" /> : <PanelLeftClose size={14} aria-hidden="true" />}
            <span className={collapsed ? 'lg:hidden' : ''}>Collapse</span>
          </button>
        </div>
      </aside>

      <div className={`flex min-h-screen flex-col transition-[padding] duration-200 ${collapsed ? 'lg:pl-[68px]' : 'lg:pl-[248px]'}`}>
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="btn-ghost h-8 w-8 p-0 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
            >
              <Menu size={17} aria-hidden="true" />
            </button>

            <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
              <span className="hidden text-faint sm:inline">Workspace</span>
              <ChevronRight size={12} className="hidden text-faint sm:inline" aria-hidden="true" />
              <span className="truncate font-medium text-ink">{title}</span>
            </div>

            <form onSubmit={submitSearch} className="ml-auto hidden max-w-[220px] flex-1 items-center sm:flex" role="search">
              <div className="relative w-full">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search portfolios"
                  aria-label="Search portfolios"
                  className="input h-8 py-1 pl-8 text-[12px]"
                />
              </div>
            </form>

            <div className="relative ml-auto flex items-center gap-2 sm:ml-2" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-1.5 rounded-md border border-line bg-surfaceRaised/60 py-1 pl-1 pr-1.5 transition-colors hover:border-lineStrong"
                aria-expanded={profileOpen}
                aria-label="Account menu"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                  {initials(user?.name)}
                </span>
                <span className="hidden max-w-[110px] truncate text-[12px] font-medium text-ink sm:block">{user?.name}</span>
                <ChevronRight size={12} className={`hidden text-faint transition-transform sm:block ${profileOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
              </button>

              {profileOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-float animate-fadeIn">
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-[13px] font-medium text-ink">{user?.name}</p>
                    <p className="truncate text-[11px] text-muted">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <NavLink to="/dashboard/settings" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-[13px] text-inkSoft hover:bg-surfaceRaised hover:text-ink">
                      <CircleUserRound size={13} aria-hidden="true" />
                      Profile &amp; settings
                    </NavLink>
                    <NavLink to="/dashboard/portfolios" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-[13px] text-inkSoft hover:bg-surfaceRaised hover:text-ink">
                      <FolderOpen size={13} aria-hidden="true" />
                      My portfolios
                    </NavLink>
                    <a href="/" className="flex items-center gap-2 rounded px-2.5 py-1.5 text-[13px] text-inkSoft hover:bg-surfaceRaised hover:text-ink">
                      <ExternalLink size={13} aria-hidden="true" />
                      Public site
                    </a>
                  </div>
                  <div className="border-t border-line p-1">
                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[13px] text-danger hover:bg-dangerSoft"
                    >
                      <LogOut size={13} aria-hidden="true" />
                      {signingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        <footer className="border-t border-line px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 text-[11px] text-faint">
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
