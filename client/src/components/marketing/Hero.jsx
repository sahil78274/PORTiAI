import { Link } from 'react-router-dom';
import { ArrowRight, LayoutTemplate, Check, Sparkles } from 'lucide-react';
import HeroPreview from './HeroPreview.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const FACTS = [
  {
    title: 'Three distinctive templates',
    body: 'Minimal Professional, Developer Portfolio, and Modern Editorial — switch anytime without data loss.',
  },
  {
    title: 'Rule-based review + AI insights',
    body: 'A documented 100-point rubric plus clear, labelled AI improvements you can apply or ignore.',
  },
  {
    title: 'A public link under your control',
    body: 'Publish to a clean URL-safe slug, share instantly with recruiters, or unpublish anytime.',
  },
];

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-white via-canvas to-canvasAlt/30">
      {/* Subtle top ambient light */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 opacity-60 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      >
        <div className="mx-auto h-full max-w-5xl bg-gradient-to-r from-indigo-100/40 via-violet-100/60 to-blue-100/40 blur-3xl" />
      </div>

      <div className="container-page pb-12 pt-12 sm:pb-16 sm:pt-16 lg:pt-20">
        <div className="grid items-start gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-2xs font-semibold uppercase tracking-[0.16em] text-indigo-700 shadow-2xs backdrop-blur-sm">
              <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" aria-hidden="true" />
              <span>Next-Gen Portfolio Platform</span>
            </div>

            <h1 className="mt-5 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[46px] lg:text-[52px]">
              Your Skills Deserve a{' '}
              <span className="bg-gradient-to-r from-accent via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Better Showcase.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-inkSoft sm:text-lg">
              Create an elegant portfolio, refine your presentation with targeted AI feedback, and share your work
              through one fast, responsive link.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={user ? '/dashboard/create' : '/register'} className="btn-primary btn-lg">
                <span>Build My Portfolio</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/templates" className="btn-secondary btn-lg">
                <LayoutTemplate size={16} aria-hidden="true" />
                <span>Explore Templates</span>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface/90 p-5 shadow-raised backdrop-blur-sm">
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-slate-500">Built for student & career success</p>
            <ul className="mt-3.5 space-y-3">
              {FACTS.map((fact) => (
                <li key={fact.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80">
                    <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="block text-sm font-semibold text-ink">{fact.title}</span>
                    <span className="block text-xs leading-relaxed text-muted">{fact.body}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-3 text-2xs leading-relaxed text-slate-500">
              Runs on zero-cost free-tier infrastructure (Render, Vercel, MongoDB Atlas, Gemini).
            </div>
          </div>
        </div>

        <div className="mt-10 lg:mt-12">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
