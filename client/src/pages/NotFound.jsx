import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, LayoutDashboard, LifeBuoy } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link to="/" aria-label="PortiAI home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-4 text-xs">
            <Link to="/templates" className="text-muted transition-colors hover:text-ink">
              Templates
            </Link>
            <Link to="/features" className="text-muted transition-colors hover:text-ink">
              Features
            </Link>
            <Link to="/login" className="btn-secondary btn-sm">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="flex flex-1 items-center">
        <div className="container-wide max-w-xl py-20">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-surface text-accent-hover">
            <Compass size={20} aria-hidden="true" />
          </span>
          <p className="mt-5 font-mono text-2xs uppercase tracking-[0.2em] text-faint">Error 404</p>
          <h1 className="mt-1.5 text-[30px] font-semibold tracking-[-0.03em] text-ink sm:text-[36px]">Page not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The URL may be mistyped or the page may have moved. If you followed a portfolio link, that portfolio might be a
            draft or have been unpublished by its owner.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              <ArrowLeft size={15} aria-hidden="true" />
              Go back
            </button>
            <Link to="/" className="btn-primary">
              Back to home
            </Link>
            <Link to="/dashboard" className="btn-secondary">
              <LayoutDashboard size={15} aria-hidden="true" />
              Dashboard
            </Link>
            <Link to="/features" className="btn-ghost">
              <LifeBuoy size={15} aria-hidden="true" />
              What PortiAI does
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
