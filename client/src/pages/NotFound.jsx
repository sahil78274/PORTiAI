import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo />
          <Link to="/" className="text-sm text-inkSoft hover:text-ink">
            Home
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center">
        <div className="container-page max-w-xl py-16">
          <span className="flex h-10 w-10 items-center justify-center rounded border border-line bg-surface text-accent">
            <Compass size={18} aria-hidden="true" />
          </span>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">Error 404</p>
          <h1 className="mt-1 text-3xl">This page does not exist</h1>
          <p className="mt-3 text-base leading-7 text-inkSoft">
            The address may be mistyped, or the page may have moved. If you followed a link to a public portfolio, the
            portfolio might be unpublished or deleted.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/" className="btn-primary">
              <ArrowLeft size={15} aria-hidden="true" /> Back to home
            </Link>
            <Link to="/dashboard" className="btn-secondary">
              Go to dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
