import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

const POINTS = [
  'Six portfolio templates that can be previewed before you choose.',
  'A structured editor with a live preview at three screen sizes.',
  'Publish to a public link, and unpublish whenever you want.',
];

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#auth-form"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-raised"
      >
        Skip to form
      </a>

      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1fr]">
        {/* Brand panel */}
        <aside className="hidden border-r border-line bg-surface px-10 py-9 lg:flex lg:flex-col lg:justify-between">
          <Logo size="lg" className="w-fit" />

          <div className="max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-hover">
              Portfolio builder
            </p>
            <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink">
              Create. Customize.
              <br />
              Publish.
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-muted">
              Build a portfolio that opens doors to new opportunities. Six layouts, a live editor and a public link you
              can share in minutes.
            </p>

            <ul className="mt-7 space-y-2.5">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[13px] leading-6 text-muted">
                  <Check size={14} className="mt-1 shrink-0 text-faint" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[12px] text-faint">© {new Date().getFullYear()} PortiAI</p>
        </aside>

        {/* Form panel */}
        <main id="auth-form" className="flex flex-col bg-canvas">
          <header className="flex items-center justify-between px-5 py-5 sm:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <ThemeToggle size="sm" />
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                Back to home
              </Link>
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 pb-14 pt-2 sm:px-8">
            <div className="w-full max-w-[380px]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
