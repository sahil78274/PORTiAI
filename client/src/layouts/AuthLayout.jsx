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
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-neu"
      >
        Skip to form
      </a>

      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]">
        {/* Brand panel */}
        <aside className="hidden p-5 lg:block">
          <div className="hero-glow relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] bg-surface px-10 py-9 shadow-neu">
            <Logo size="lg" />

            <div className="relative max-w-md">
              <p className="eyebrow">AI portfolio builder</p>
              <h1 className="mt-3 text-[34px] font-bold leading-[1.12] tracking-[-0.03em] text-ink">
                Create. Customize.
                <br />
                Publish.
              </h1>
              <p className="mt-3 text-[14px] leading-6 text-muted">
                Build a portfolio that opens doors to new opportunities. Six layouts, a live editor and a public link you
                can share in minutes.
              </p>

              <ul className="mt-7 space-y-3">
                {POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[13px] leading-6 text-inkSoft">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-surface text-accent-hover shadow-neu-xs">
                      <Check size={13} aria-hidden="true" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              {/* Decorative editor mockup, drawn with CSS */}
              <div className="mt-9 rounded-[20px] bg-canvas p-3 shadow-neu-inset" aria-hidden="true">
                <div className="flex gap-3 rounded-[14px] bg-surface p-3 shadow-neu-sm">
                  <div className="w-1/3 space-y-2">
                    <div className="h-2 w-3/4 rounded-full bg-accent/70" />
                    <div className="h-6 rounded-[8px] bg-canvas shadow-neu-inset-xs" />
                    <div className="h-6 rounded-[8px] bg-canvas shadow-neu-inset-xs" />
                    <div className="h-6 rounded-[8px] bg-accent shadow-neu-accent" />
                  </div>
                  <div className="flex-1 rounded-[10px] bg-white p-3">
                    <div className="h-2 w-1/2 rounded-full bg-[#1a1f2b]" />
                    <div className="mt-1.5 h-1.5 w-1/3 rounded-full bg-accent" />
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <div className="h-7 rounded-[5px] bg-[#eef0f5]" />
                      <div className="h-7 rounded-[5px] bg-[#eef0f5]" />
                      <div className="h-7 rounded-[5px] bg-[#eef0f5]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-faint">© {new Date().getFullYear()} PortiAI</p>
          </div>
        </aside>

        {/* Form panel */}
        <main id="auth-form" className="flex flex-col bg-canvas">
          <header className="flex items-center justify-between px-5 py-5 sm:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <Link to="/" className="btn-ghost btn-sm ml-auto">
              <ArrowLeft size={13} aria-hidden="true" />
              Back to home
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 pb-14 pt-2 sm:px-8">
            <div className="w-full max-w-[420px]">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
