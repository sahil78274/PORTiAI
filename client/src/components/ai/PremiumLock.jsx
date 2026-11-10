import { Link } from 'react-router-dom';
import { ArrowRight, Check, Lock, Sparkles, Wand2 } from 'lucide-react';

/**
 * Locked state for free accounts.
 *
 * The real gate is on the API (`403 PREMIUM_REQUIRED` on every AI endpoint);
 * this screen only explains the feature and points to the pricing page.
 */
export default function PremiumLock() {
  return (
    <div className="surface-card overflow-hidden">
      <div className="relative border-b border-line bg-canvasAlt px-6 py-10 text-center">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-accent-line bg-accent-soft text-accent-hover">
          <Lock size={20} aria-hidden="true" />
        </span>
        <p className="relative mt-4 eyebrow-accent mx-auto">
          <Sparkles size={11} aria-hidden="true" />
          Premium feature
        </p>
        <h1 className="relative mx-auto mt-2 max-w-xl text-balance text-[26px] font-semibold leading-[1.12] tracking-[-0.03em] text-ink">
          The AI Project Builder writes a complete project, not just a description
        </h1>
        <p className="relative mx-auto mt-3 max-w-xl text-[13.5px] leading-6 text-muted">
          Describe an idea and get a working structure — frontend and backend files, responsive UI, README and setup
          steps — ready to preview, download and add to your portfolio.
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">What you can build</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {[
              ['HTML, CSS & JavaScript', 'A real static site with working interactions.'],
              ['React.js', 'Components, routing and responsive styling.'],
              ['React + Node + Express', 'A frontend and an API with sensible routes.'],
              ['MERN', 'Models, controllers, API client and UI.'],
              ['Python', 'A Python service with clear setup instructions.'],
              ['Any idea', 'Portfolio projects, dashboards, tools and landing pages.'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-lg border border-line bg-canvas p-3">
                <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                  <Wand2 size={12} className="text-accent-hover" aria-hidden="true" />
                  {title}
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-accent-line bg-accent-soft p-4">
          <p className="text-[12px] font-semibold text-ink">Included with Premium</p>
          <ul className="mt-3 space-y-2">
            {[
              'Monthly AI project credits',
              'Organised code editor and live preview',
              'Regenerate or modify a single file',
              'Download the whole project as ZIP',
              'Add projects to any portfolio',
              'Every premium template',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-[12px] leading-5 text-inkSoft">
                <Check size={13} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link to="/pricing" className="btn-primary mt-4 w-full justify-center">
            Upgrade to Premium
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <p className="mt-2 text-center text-[10.5px] leading-4 text-faint">
            Your work is never deleted if you cancel.
          </p>
        </aside>
      </div>
    </div>
  );
}
