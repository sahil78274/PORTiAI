import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Menu, Sparkles, X } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import ThemeMenu from '../theme/ThemeMenu.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const LINKS = [
  { label: 'Templates', to: '/templates' },
  { label: 'Features', to: '/#features', hash: 'features' },
  { label: 'How it works', to: '/#how-it-works', hash: 'how-it-works' },
  { label: 'Premium', to: '/premium' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, isPremium } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const go = (event, link) => {
    event.preventDefault();
    setOpen(false);
    if (link.hash) {
      if (location.pathname === '/') {
        document.getElementById(link.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', `/#${link.hash}`);
      } else {
        navigate(`/#${link.hash}`);
      }
      return;
    }
    navigate(link.to);
  };

  const isActive = (link) => (link.hash ? false : location.pathname === link.to || location.pathname.startsWith(`${link.to}/`));

  return (
    <header className="sticky top-0 z-40 border-b border-line glass-bar">
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                aria-current={isActive(link) ? 'page' : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive(link) ? 'bg-surfaceRaised text-ink' : 'text-muted hover:bg-surfaceRaised hover:text-ink'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {loading ? (
              <span className="h-8 w-28 animate-pulse rounded-full bg-canvasAlt" aria-hidden="true" />
            ) : user ? (
              <>
                {isPremium ? (
                  <span className="hidden items-center gap-1 rounded-full border border-accent-line bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent-hover lg:inline-flex">
                    <Sparkles size={10} aria-hidden="true" />
                    Premium
                  </span>
                ) : null}
                <Link to="/dashboard" className="btn-primary btn-sm rounded-full">
                  <LayoutDashboard size={13} aria-hidden="true" />
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary btn-sm rounded-full">
                  Start free
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>

          <ThemeMenu size="sm" />

          <button
            type="button"
            className="btn-ghost h-9 w-9 rounded-full p-0 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-surface px-4 py-4 md:hidden animate-fadeIn">
          <nav aria-label="Mobile" className="flex flex-col">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-inkSoft hover:bg-surfaceRaised hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary w-full justify-center">
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary w-full justify-center">
                    Login
                  </Link>
                  <Link to="/signup" className="btn-primary w-full justify-center">
                    Start free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
