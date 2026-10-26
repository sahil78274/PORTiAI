import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const LINKS = [
  { label: 'Features', to: '/#features', hash: 'features' },
  { label: 'Templates', to: '/templates' },
  { label: 'Pricing', to: '/#pricing', hash: 'pricing' },
  { label: 'FAQ', to: '/#faq', hash: 'faq' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
    } else {
      navigate(link.to);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'border-b border-white/[0.07] bg-[#070b18]/85 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-9">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-medium tracking-tight transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-white/[0.06] text-white'
                    : 'text-muted hover:bg-white/[0.04] hover:text-ink'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <span className="h-9 w-28 animate-pulse rounded-lg bg-white/[0.06]" aria-hidden="true" />
          ) : user ? (
            <Link to="/dashboard" className="btn-primary btn-sm">
              <LayoutDashboard size={14} aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm text-inkSoft">
                Log in
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                <span>Get Started</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-ghost h-9 w-9 rounded-lg p-0 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-white/[0.07] bg-[#070b18]/97 px-4 py-4 backdrop-blur-xl md:hidden animate-fadeIn">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.hash ? `/#${link.hash}` : link.to}
                onClick={(event) => go(event, link)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-inkSoft hover:bg-white/[0.05] hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.07] pt-3">
              {user ? (
                <Link to="/dashboard" className="btn-primary w-full justify-center">
                  <LayoutDashboard size={15} aria-hidden="true" />
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary w-full justify-center">
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary w-full justify-center">
                    Get Started Free
                    <ArrowRight size={15} aria-hidden="true" />
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
