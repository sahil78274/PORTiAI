import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, Settings, LogOut, Menu, X, Sparkles } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { initials } from '../utils/format.js';

const NAV = [
  { to: '/dashboard', label: 'Portfolios', icon: LayoutDashboard, end: true },
  { to: '/dashboard/create', label: 'New portfolio', icon: Plus },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

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

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo />
            <nav aria-label="Dashboard" className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-colors ${
                        isActive ? 'bg-canvasAlt text-ink' : 'text-inkSoft hover:bg-canvasAlt hover:text-ink'
                      }`
                    }
                  >
                    <Icon size={14} aria-hidden="true" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <NavLink to="/dashboard/create" className="btn-primary hidden sm:inline-flex">
              <Plus size={14} aria-hidden="true" /> New portfolio
            </NavLink>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-2 rounded border border-lineStrong bg-surface px-2 py-1 text-sm hover:bg-canvasAlt"
                aria-expanded={open}
                aria-controls="account-menu"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-2xs font-semibold text-accent">
                  {initials(user?.name)}
                </span>
                <span className="hidden max-w-[140px] truncate text-sm text-ink sm:block">{user?.name}</span>
                <Menu size={13} className="text-muted sm:hidden" aria-hidden="true" />
              </button>

              {open ? (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
                  <div
                    id="account-menu"
                    className="absolute right-0 z-40 mt-1.5 w-56 rounded-md border border-line bg-surface p-1 shadow-raised"
                  >
                    <div className="border-b border-line px-2.5 py-2">
                      <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
                      <p className="truncate text-xs text-muted">{user?.email}</p>
                    </div>
                    <div className="pt-1 md:hidden">
                      {NAV.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-inkSoft hover:bg-canvasAlt hover:text-ink"
                        >
                          <item.icon size={14} aria-hidden="true" />
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                    <NavLink
                      to="/dashboard/settings"
                      className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-inkSoft hover:bg-canvasAlt hover:text-ink"
                    >
                      <Settings size={14} aria-hidden="true" /> Account settings
                    </NavLink>
                    <NavLink
                      to="/templates"
                      className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-inkSoft hover:bg-canvasAlt hover:text-ink"
                    >
                      <Sparkles size={14} aria-hidden="true" /> Template gallery
                    </NavLink>
                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={signingOut}
                      className="mt-1 flex w-full items-center gap-2 rounded border-t border-line px-2.5 py-1.5 text-left text-sm text-danger hover:bg-dangerSoft"
                    >
                      <LogOut size={14} aria-hidden="true" /> {signingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line py-4">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 text-xs text-muted sm:px-6">
          <p>PortiAI · academic project</p>
          <div className="flex gap-4">
            <NavLink to="/privacy" className="hover:text-ink">
              Privacy
            </NavLink>
            <NavLink to="/terms" className="hover:text-ink">
              Terms
            </NavLink>
            <a href="/" className="hover:text-ink">
              Public site
            </a>
          </div>
        </div>
      </footer>
      <span className="sr-only">
        <X size={1} aria-hidden="true" />
      </span>
    </div>
  );
}
