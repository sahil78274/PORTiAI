import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo />
          <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-ink transition-colors">
            Home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="container-page max-w-xl py-16">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface text-accent shadow-2xs">
            <Compass size={20} aria-hidden="true" />
          </span>
          <p className="mt-4 font-mono text-2xs uppercase tracking-widest text-slate-400">Error 404</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Page not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The URL may be mistyped or the page has been moved. If you followed a link to a student portfolio, it may be in draft mode or unpublished.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/" className="btn-primary">
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Back to home</span>
            </Link>
            <Link to="/dashboard" className="btn-secondary">
              <span>Go to dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
