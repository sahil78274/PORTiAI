import { Link } from 'react-router-dom';
import { ArrowRight, LayoutTemplate, Check } from 'lucide-react';
import HeroPreview from './HeroPreview.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const FACTS = [
  {
    title: 'Three complete templates',
    body: 'Minimal Professional, Developer Portfolio and Modern Editorial — switch without losing content.',
  },
  {
    title: 'Rule-based review, optional AI',
    body: 'A documented 100-point rubric plus labelled AI observations you can apply or ignore.',
  },
  {
    title: 'A public link you control',
    body: 'Publish at a URL-safe address, copy it, and unpublish whenever you want it offline.',
  },
];

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="container-page pb-10 pt-12 sm:pb-14 sm:pt-16">
        <div className="grid items-start gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          <div>
            <p className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-2 py-1 text-2xs font-medium uppercase tracking-[0.12em] text-inkSoft">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              Portfolio builder and analyzer
            </p>

            <h1 className="mt-5 text-[34px] leading-[1.08] tracking-[-0.02em] sm:text-[44px] lg:text-[48px]">
              Your Skills Deserve a Better Showcase.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-inkSoft sm:text-lg">
              Create a professional portfolio, improve your presentation with AI and share your work through one simple
              link.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to={user ? '/dashboard/create' : '/register'} className="btn-primary px-4 py-2 text-base">
                Build My Portfolio
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link to="/templates" className="btn-secondary px-4 py-2 text-base">
                <LayoutTemplate size={15} aria-hidden="true" />
                Explore Templates
              </Link>
            </div>

          </div>

          <div className="rounded-md border border-line bg-surface p-4 shadow-card">
            <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted">What you get</p>
            <ul className="mt-2.5 space-y-2.5">
              {FACTS.map((fact) => (
                <li key={fact.title} className="flex gap-2.5">
                  <Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-medium text-ink">{fact.title}</span>
                    <span className="block text-xs leading-5 text-muted">{fact.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-2.5 text-2xs leading-5 text-muted">
              Runs on free-tier services. AI generation is subject to the Gemini quota; the rule-based analyzer and
              publishing always work.
            </p>
          </div>
        </div>

        <div className="mt-9">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}
