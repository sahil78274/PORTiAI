import { Link } from 'react-router-dom';
import { ArrowRight, Gauge, ListChecks, Quote, CheckCircle2 } from 'lucide-react';
import { ProgressBar, ScoreRing } from '../ui/Primitives.jsx';
import { demoAnalysis } from '../../utils/demoPortfolio.js';

const TONE = (ratio) => (ratio >= 0.8 ? 'success' : ratio >= 0.6 ? 'accent' : 'warning');

/** Illustrative analyzer panel. Every number here is sample data. */
export default function AnalyzerPreview() {
  return (
    <section id="analyzer" className="container-page py-16 sm:py-24" aria-labelledby="analyzer-heading">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow">Portfolio Analyzer</p>
          <h2 id="analyzer-heading" className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            A thorough evaluation you can act on, with clear reasoning
          </h2>
          <p className="mt-3 text-base leading-relaxed text-inkSoft">
            The analyzer evaluates the measurable pillars of a portfolio: profile completeness, project depth,
            technical clarity, link accessibility, and writing impact. You get an objective score out of 100 with
            prioritized next steps.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-inkSoft">
            <li className="flex gap-2.5 items-start">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-accent-line/60">
                <Gauge size={12} aria-hidden="true" />
              </span>
              <span>Scores are reproducible from a documented 100-point rubric and update as content improves.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-accent-line/60">
                <ListChecks size={12} aria-hidden="true" />
              </span>
              <span>Suggestions are specific to your sections, with before-and-after rewrite patterns.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-accent-line/60">
                <CheckCircle2 size={12} aria-hidden="true" />
              </span>
              <span>Results evaluate content quality, not arbitrary automated hiring predictions.</span>
            </li>
          </ul>
          <div className="mt-7">
            <Link to="/register" className="btn-primary btn-lg">
              <span>Analyze my portfolio</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden bg-surface shadow-raised">
          <div className="flex items-center justify-between border-b border-line bg-slate-50/80 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <p className="text-xs font-semibold text-ink">Sample Portfolio Assessment</p>
            </div>
            <span className="badge-draft">100-pt Rubric</span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center rounded-xl border border-line bg-slate-50/50 p-4">
                <ScoreRing score={demoAnalysis.score} size={118} />
                <p className="mt-2 text-xs font-semibold text-ink">{demoAnalysis.grade} Rating</p>
              </div>
              <div className="w-full flex-1 space-y-2.5">
                {demoAnalysis.categories.map((category) => (
                  <ProgressBar
                    key={category.id}
                    label={category.label}
                    value={category.score}
                    max={category.max}
                    tone={TONE(category.score / category.max)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-4">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Detected issues</p>
              <ul className="mt-2.5 space-y-2">
                {demoAnalysis.issues.map((issue) => (
                  <li key={issue.id} className="flex items-start gap-2 text-xs leading-relaxed text-inkSoft">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        issue.severity === 'high' ? 'bg-danger' : issue.severity === 'medium' ? 'bg-warning' : 'bg-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="capitalize text-ink">{issue.severity}: </strong>
                      {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-3.5 shadow-2xs">
              <p className="text-2xs font-bold uppercase tracking-wider text-indigo-700">Sample pattern recommendation</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                <span className="font-semibold text-slate-900">Before:</span> “A book tracker app made with React.”
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                <span className="font-semibold text-slate-900">Pattern:</span> “BookNest is a reading dashboard built for students. I developed the custom shelf filters, JWT auth and Goodreads CSV importer.”
              </p>
              <p className="mt-2 text-2xs text-slate-500">
                Structural guidance only — the analyzer never invents facts or projects.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
