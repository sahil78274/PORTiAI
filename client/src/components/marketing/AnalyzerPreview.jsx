import { Link } from 'react-router-dom';
import { ArrowRight, Gauge, ListChecks, Quote } from 'lucide-react';
import { ProgressBar, ScoreRing } from '../ui/Primitives.jsx';
import { demoAnalysis } from '../../utils/demoPortfolio.js';

const TONE = (ratio) => (ratio >= 0.8 ? 'success' : ratio >= 0.6 ? 'accent' : 'warning');

/** Illustrative analyzer panel. Every number here is sample data. */
export default function AnalyzerPreview() {
  return (
    <section id="analyzer" className="container-page py-16 sm:py-20" aria-labelledby="analyzer-heading">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow">Portfolio analyzer</p>
          <h2 id="analyzer-heading" className="mt-2 text-2xl sm:text-3xl">
            A review you can act on, with the reasoning shown
          </h2>
          <p className="mt-3 text-base leading-7 text-inkSoft">
            The analyzer checks the parts of a portfolio that are measurable: is anything empty, are project
            descriptions specific, do the links work, is the writing readable. You get a score out of 100, the category
            breakdown, the issues found and a prioritised list of what to fix first.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-inkSoft">
            <li className="flex gap-2">
              <Gauge size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              Scores are reproducible from the documented rubric and re-run whenever the content changes.
            </li>
            <li className="flex gap-2">
              <ListChecks size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              Suggestions are specific to your sections, with example rewrites you can apply or ignore.
            </li>
            <li className="flex gap-2">
              <Quote size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
              Results are never presented as a hiring probability — only as content quality feedback.
            </li>
          </ul>
          <Link to="/register" className="btn-primary mt-6">
            Analyze my portfolio
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-canvasAlt/60 px-4 py-2.5">
            <p className="text-xs font-medium text-ink">Portfolio review</p>
            <span className="badge-draft">Sample data</span>
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center">
                <ScoreRing score={demoAnalysis.score} size={118} />
                <p className="mt-2 text-xs font-medium text-ink">{demoAnalysis.grade}</p>
              </div>
              <div className="w-full flex-1 space-y-2">
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

            <div className="mt-5 border-t border-line pt-4">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted">Detected issues</p>
              <ul className="mt-2 space-y-2">
                {demoAnalysis.issues.map((issue) => (
                  <li key={issue.id} className="flex items-start gap-2 text-xs leading-5 text-inkSoft">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        issue.severity === 'high' ? 'bg-danger' : issue.severity === 'medium' ? 'bg-warning' : 'bg-lineStrong'
                      }`}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="font-medium capitalize text-ink">{issue.severity}: </span>
                      {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded border border-accent-line bg-accent-soft/70 p-3">
              <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent">Sample content recommendation</p>
              <p className="mt-1.5 text-xs leading-5 text-inkSoft">
                <span className="font-medium text-ink">Before:</span> “A book tracker app made with React.”
              </p>
              <p className="mt-1 text-xs leading-5 text-inkSoft">
                <span className="font-medium text-ink">Pattern:</span> “{'{Project}'} is a {'{type}'} app for{' '}
                {'{who}'}. I built {'{features}'} and handled {'{your part}'}. {'{What works today}'}.”
              </p>
              <p className="mt-1.5 text-2xs text-muted">
                Structural guidance only — the analyzer never invents metrics or outcomes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
