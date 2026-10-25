import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, Settings, LogOut, Menu, X, Sparkles, ChevronDown } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { initials } from '../utils/format.js';

const NAV = [
  { to: '/dashboard', label: 'Portfolios', icon: LayoutDashboard, end: true },
  { to: '/dashboard/create', label: 'New Portfolio', icon: Plus },
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
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-7">
            <Logo />
            <nav aria-label="Dashboard navigation" className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight transition-all ${
                        isActive
                          ? 'bg-slate-100 text-ink shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
                      }`
                    }
                  >
                    <Icon size={14} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <NavLink to="/dashboard/create" className="btn-primary btn-sm hidden sm:inline-flex">
              <Plus size={13} aria-hidden="true" />
              <span>New Portfolio</span>
            </NavLink>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium shadow-2xs hover:border-lineStrong hover:bg-slate-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-expanded={open}
                aria-controls="account-menu"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-2xs font-bold text-accent">
                  {initials(user?.name)}
                </span>
                <span className="hidden max-w-[140px] truncate text-ink font-semibold sm:block">{user?.name}</span>
                <ChevronDown size={13} className="text-slate-400" aria-hidden="true" />
              </button>

              {open ? (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
                  <div
                    id="account-menu"
                    className="absolute right-0 z-40 mt-1.5 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-float animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="border-b border-line px-3 py-2.5 mb-1">
                      <p className="truncate text-xs font-semibold text-ink">{user?.name}</p>
                      <p className="truncate text-2xs text-muted">{user?.email}</p>
                    </div>

                    <div className="md:hidden pb-1 mb-1 border-b border-line">
                      {NAV.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-inkSoft hover:bg-slate-100 hover:text-ink transition-colors"
                        >
                          <item.icon size={14} aria-hidden="true" />
                          <span>{item.label}</span>
                        </NavLink>
                      ))}
                    </div>

                    <NavLink
                      to="/dashboard/settings"
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-inkSoft hover:bg-slate-100 hover:text-ink transition-colors"
                    >
                      <Settings size={14} aria-hidden="true" />
                      <span>Account settings</span>
                    </NavLink>

                    <NavLink
                      to="/templates"
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-inkSoft hover:bg-slate-100 hover:text-ink transition-colors"
                    >
                      <Sparkles size={14} aria-hidden="true" />
                      <span>Template gallery</span>
                    </NavLink>

                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={signingOut}
                      className="mt-1.5 flex w-full items-center gap-2 rounded-lg border-t border-line px-2.5 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
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

      <footer className="border-t border-line py-4 bg-surface">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 text-2xs text-muted sm:px-6">
          <p>© {new Date().getFullYear()} PortiAI · Academic Final Year Project</p>
          <div className="flex gap-4">
            <NavLink to="/privacy" className="hover:text-ink transition-colors">
              Privacy
            </NavLink>
            <NavLink to="/terms" className="hover:text-ink transition-colors">
              Terms
            </NavLink>
            <a href="/" className="hover:text-ink transition-colors">
              Public site
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
