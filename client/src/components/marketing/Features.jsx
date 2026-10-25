import { Link } from 'react-router-dom';
import {
  Sparkles,
  Gauge,
  LayoutTemplate,
  MonitorSmartphone,
  Globe2,
  FolderKanban,
  ArrowRight,
} from 'lucide-react';

const PRIMARY = [
  {
    id: 'generation',
    icon: Sparkles,
    title: 'AI portfolio generation & rewrite',
    body:
      'Draft a biography, summary, project description or skill list from the facts you have already entered. Every generated block stays editable, and regeneration is per section rather than all-or-nothing.',
    detail: 'Runs server-side through Gemini. If the quota is exhausted, editing and publishing continue to work smoothly.',
    to: '/#faq',
    linkLabel: 'How quota handling works',
  },
  {
    id: 'analysis',
    icon: Gauge,
    title: 'Rule-based rubric + AI analysis',
    body:
      'A deterministic rubric scores seven areas of your portfolio — completeness, summary clarity, project quality, skills, education, experience, and links — then AI feedback adds observations the rules miss.',
    detail: 'Rule-based scoring always runs; AI suggestions are clearly labelled separately whenever they are used.',
    to: '/#analyzer',
    linkLabel: 'See sample review',
  },
];

const SECONDARY = [
  {
    icon: LayoutTemplate,
    title: 'Three distinct portfolio designs',
    body: 'Minimal Professional, Developer Portfolio and Modern Editorial — each rendering the same saved portfolio data.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Split-screen live editor',
    body: 'Edit on the left, watch the real template update instantly on the right. Switch templates and themes without losing content.',
  },
  {
    icon: Globe2,
    title: 'Public portfolio publishing',
    body: 'Publish to a clean URL-safe link such as /p/aarav-mehta. Copy it for applications, or unpublish anytime.',
  },
  {
    icon: FolderKanban,
    title: 'Productive personal dashboard',
    body: 'Manage all your portfolios with publication status, real-time metrics, search, sorting, duplication, and instant previews.',
  },
];

export default function Features() {
  return (
    <section id="features" className="border-t border-line bg-canvasAlt/30 py-16 sm:py-24" aria-labelledby="features-heading">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">Core Capabilities</p>
          <h2 id="features-heading" className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Everything your portfolio needs, nothing unnecessary
          </h2>
          <p className="mt-3 text-base leading-relaxed text-inkSoft">
            Six focused capabilities, each built into real application pages. AI serves as an accelerator—your
            facts remain under your full control.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {PRIMARY.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.id} className="card-hover flex flex-col p-6 sm:p-7 bg-surface">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent-line/60">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-inkSoft">{feature.body}</p>
                <p className="mt-4 border-t border-line pt-3.5 text-xs leading-relaxed text-muted">{feature.detail}</p>
                <Link to={feature.to} className="btn-link mt-3.5 self-start">
                  <span>{feature.linkLabel}</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECONDARY.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="card-hover p-5 bg-surface flex flex-col">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">{feature.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted flex-1">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
