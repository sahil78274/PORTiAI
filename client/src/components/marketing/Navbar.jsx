import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ArrowRight } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const LINKS = [
  { label: 'Features', to: '/#features', hash: 'features' },
  { label: 'Templates', to: '/templates' },
  { label: 'How It Works', to: '/#how-it-works', hash: 'how-it-works' },
  { label: 'FAQ', to: '/#faq', hash: 'faq' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'border-b border-line/90 bg-white/85 shadow-xs backdrop-blur-md'
          : 'border-b border-line/60 bg-white/70 backdrop-blur-sm'
      }`}
    >
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium tracking-tight transition-all duration-150 ${
                  location.pathname === link.to
                    ? 'bg-slate-100 text-ink font-semibold'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-ink'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <span className="h-8 w-20 animate-pulse rounded-md bg-slate-200/70" aria-hidden="true" />
          ) : user ? (
            <Link to="/dashboard" className="btn-primary btn-sm">
              <LayoutDashboard size={13} aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm text-slate-700">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                <span>Get Started</span>
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-ghost h-8 w-8 rounded-md p-0 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-white/95 px-4 py-4 shadow-raised backdrop-blur-md md:hidden animate-in fade-in duration-150">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary w-full justify-center">
                  <LayoutDashboard size={14} aria-hidden="true" />
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary w-full justify-center">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary w-full justify-center">
                    Get Started Free
                    <ArrowRight size={14} aria-hidden="true" />
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
