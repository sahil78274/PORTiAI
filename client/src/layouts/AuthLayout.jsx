import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

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
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-raised"
      >
        Skip to form
      </a>

      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1fr]">
        {/* Brand panel */}
        <aside className="hidden border-r border-line bg-[#16233b] px-10 py-9 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" aria-label="PortiAI home" className="text-white">
            <Logo size="lg" tone="light" />
          </Link>

          <div className="max-w-md">
            <h1 className="text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-white">
              A portfolio that shows your work properly.
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-white/65">
              PortiAI is a portfolio builder for developers, designers, students and freelancers. Pick a layout, add your
              details, publish when it is ready.
            </p>

            <ul className="mt-7 space-y-2.5">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[13px] leading-6 text-white/70">
                  <Check size={14} className="mt-1 shrink-0 text-white/50" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[12px] text-white/40">© {new Date().getFullYear()} PortiAI</p>
        </aside>

        {/* Form panel */}
        <main id="auth-form" className="flex flex-col bg-white">
          <header className="flex items-center justify-between px-5 py-5 sm:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <Link
              to="/"
              className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              Back to home
            </Link>
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
