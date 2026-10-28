import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import ThemeMenu from '../theme/ThemeMenu.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Compact marketing header.
 *
 * Deliberately quiet: wordmark, three links, a two-option theme control and a
 * single action. Nothing here competes with the template grid below it.
 */
const LINKS = [
  { label: 'Templates', to: '/templates' },
  { label: 'Features', to: '/features' },
  { label: 'Premium', to: '/premium' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, isPremium } = useAuth();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const isActive = (link) => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line glass-bar">
      <div className="container-wide flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-5 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                aria-current={isActive(link) ? 'page' : undefined}
                className={`text-[13px] font-medium transition-colors ${
                  isActive(link) ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {loading ? (
              <span className="h-7 w-20 animate-pulse rounded bg-canvasAlt" aria-hidden="true" />
            ) : user ? (
              <>
                {isPremium ? (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent">Premium</span>
                ) : null}
                <Link to="/dashboard" className="btn-primary btn-sm">
                  <LayoutDashboard size={13} aria-hidden="true" />
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="px-2 text-[13px] font-medium text-muted transition-colors hover:text-ink">
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary btn-sm">
                  Start free
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>

          <ThemeMenu size="sm" />

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surfaceRaised hover:text-ink md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={17} aria-hidden="true" /> : <Menu size={17} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-surface px-4 py-3 md:hidden animate-fadeIn">
          <nav aria-label="Mobile" className="flex flex-col">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-md px-2 py-2.5 text-[14px] font-medium text-inkSoft hover:bg-surfaceRaised hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary w-full justify-center">
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary w-full justify-center">
                    Sign in
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
