import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, Check, Gauge, Sparkles, Wand2 } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

const POINTS = [
  { icon: Sparkles, title: 'Conversational AI builder', desc: 'Answer a few questions and get structured, editable portfolio copy.' },
  { icon: Wand2, title: 'Nine distinctive templates', desc: 'Switch design any time without rewriting a word.' },
  { icon: Gauge, title: 'Honest quality analysis', desc: 'A documented 100-point rubric plus clearly-labelled AI suggestions.' },
];

const FACTS = ['Free to start', 'No card required', 'You own your data'];

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#auth-form"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-ink focus:shadow-raised"
      >
        Skip to form
      </a>

      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden border-r border-white/[0.07] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[#050813]" aria-hidden="true" />
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(ellipse 700px 480px at 30% 12%, rgba(99,102,241,0.32), transparent 65%), radial-gradient(ellipse 620px 420px at 82% 78%, rgba(168,85,247,0.26), transparent 65%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.15]"
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse at 40% 30%, black, transparent 75%)',
            }}
          />

          <div className="relative px-10 py-9">
            <Logo size="lg" />
          </div>

          <div className="relative px-10 pb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-inkSoft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-hover" aria-hidden="true" />
              AI portfolio studio
            </span>
            <h1 className="mt-5 max-w-lg text-4xl font-bold leading-[1.1] tracking-tight text-white text-balance">
              A portfolio that shows your work{' '}
              <span className="gradient-text">the way it deserves.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Build, refine and publish a professional portfolio with an AI assistant that stays grounded in your real
              experience.
            </p>

            <ul className="mt-9 max-w-md space-y-4">
              {POINTS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-accent-hover">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative border-t border-white/[0.07] px-10 py-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-faint">
              {FACTS.map((fact) => (
                <span key={fact} className="inline-flex items-center gap-1.5">
                  <Check size={11} className="text-success" aria-hidden="true" />
                  {fact}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <main id="auth-form" className="flex flex-col">
          <header className="flex items-center justify-between px-5 py-5 sm:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink">
              <ArrowLeft size={13} aria-hidden="true" />
              Back to home
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-2 sm:px-8">
            <div className="w-full max-w-[420px] animate-fadeUp">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
