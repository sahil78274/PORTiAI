import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { Button } from '../ui/Primitives.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const LINKS = [
  { label: 'Features', to: '/#features', hash: 'features' },
  { label: 'Templates', to: '/templates' },
  { label: 'How It Works', to: '/#how-it-works', hash: 'how-it-works' },
  { label: 'FAQ', to: '/#faq', hash: 'faq' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const go = (event, link) => {
    event.preventDefault();
    setOpen(false);
    const target = link.hash ? `/#${link.hash}` : link.to;
    navigate(target);
    if (link.hash && location.pathname === '/') {
      document.getElementById(link.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${link.hash}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-[2px]">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className={`rounded px-2.5 py-1.5 text-sm transition-colors ${
                  location.pathname === link.to ? 'text-ink' : 'text-inkSoft hover:bg-canvasAlt hover:text-ink'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <span className="h-8 w-24 animate-pulse rounded bg-canvasAlt" aria-hidden="true" />
          ) : user ? (
            <Link to="/dashboard" className="btn-primary">
              <LayoutDashboard size={15} aria-hidden="true" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-ghost md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-canvas md:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-3">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className="rounded px-2 py-2 text-sm text-inkSoft hover:bg-canvasAlt hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary w-full">
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary w-full">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary w-full">
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
