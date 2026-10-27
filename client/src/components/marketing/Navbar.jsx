import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const LINKS = [
  { label: 'Features', to: '/#features', hash: 'features' },
  { label: 'Templates', to: '/templates' },
  { label: 'How It Works', to: '/#how-it-works', hash: 'how-it-works' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <header
      className="sticky top-0 z-40 px-3 pt-3 sm:px-4"
    >
      <div
        className={`container-wide flex h-16 items-center justify-between gap-4 rounded-[20px] transition-[box-shadow,background-color] duration-200 ${
          scrolled ? 'bg-canvas shadow-neu-sm' : 'bg-transparent shadow-none'
        }`}
      >
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className="rounded-[10px] px-3 py-2 text-[13px] font-medium text-muted transition-[box-shadow,color] hover:text-ink hover:shadow-neu-xs"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-1.5 md:flex">
          {loading ? (
            <span className="skeleton h-9 w-28" aria-hidden="true" />
          ) : user ? (
            <Link to="/dashboard" className="btn-primary">
              <LayoutDashboard size={13} aria-hidden="true" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Build Your Portfolio
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="icon-btn h-10 w-10 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="mx-auto mt-2 max-w-wide rounded-[20px] bg-surface p-3 shadow-neu md:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className="menu-item py-2.5 text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-line px-1 pb-1 pt-4">
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
                    Build your portfolio
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
