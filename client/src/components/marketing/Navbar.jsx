import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const LINKS = [
  { label: 'Features', to: '/#features', hash: 'features' },
  { label: 'Templates', to: '/templates' },
  { label: 'How It Works', to: '/#how-it-works', hash: 'how-it-works' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
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

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {loading ? (
              <span className="h-8 w-28 animate-pulse rounded-md bg-canvasAlt" aria-hidden="true" />
            ) : user ? (
              <Link to="/dashboard" className="btn-primary btn-sm">
                <LayoutDashboard size={13} aria-hidden="true" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  Login
                </Link>
                <Link to="/signup" className="btn-primary btn-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Always visible, on every viewport: no settings page required. */}
          <ThemeToggle className="ml-1" />

          <button
            type="button"
            className="btn-ghost h-9 w-9 rounded-md p-0 md:hidden"
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
        <div id="mobile-nav" className="border-t border-line bg-canvas px-4 py-3 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-inkSoft hover:bg-surface hover:text-ink"
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
                    Get Started
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
