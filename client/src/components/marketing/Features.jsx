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
    title: 'AI portfolio generation',
    body:
      'Draft a biography, summary, project description or skill list from the facts you have already entered. Every generated block stays editable, and regeneration is per section rather than all-or-nothing.',
    detail: 'Runs server-side through Gemini. If the quota is exhausted, editing and publishing continue to work.',
    to: '/#faq',
    linkLabel: 'How quota handling works',
  },
  {
    id: 'analysis',
    icon: Gauge,
    title: 'AI-based portfolio analysis',
    body:
      'A deterministic rubric scores seven areas of your portfolio — completeness, summary clarity, project quality, skills, education and experience, links, and readability — then AI feedback adds observations the rules miss.',
    detail: 'Rule-based scoring always runs; AI suggestions are labelled separately whenever they are used.',
    to: '/#analyzer',
    linkLabel: 'See a sample analysis',
  },
];

const SECONDARY = [
  {
    icon: LayoutTemplate,
    title: 'Professional portfolio templates',
    body: 'Three distinct layouts — Minimal Professional, Developer Portfolio and Modern Editorial — each rendering the same saved data.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Live preview and customisation',
    body: 'Edit on the left, watch the real template update on the right. Switch templates, accent colour, font and section order without losing content.',
  },
  {
    icon: Globe2,
    title: 'Public portfolio publishing',
    body: 'Publish to a URL-safe link such as /p/aarav-mehta, copy it, and unpublish whenever you want the page to stop resolving.',
  },
  {
    icon: FolderKanban,
    title: 'Personal dashboard',
    body: 'Every portfolio you own in one list, with draft or published status, last-updated time, search, sort, duplicate and delete.',
  },
];

export default function Features() {
  return (
    <section id="features" className="border-t border-line bg-canvasAlt/40 py-16 sm:py-20" aria-labelledby="features-heading">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">Features</p>
          <h2 id="features-heading" className="mt-2 text-2xl sm:text-3xl">
            Everything a portfolio needs, nothing it does not
          </h2>
          <p className="mt-3 text-base leading-7 text-inkSoft">
            Six features, each tied to a screen that actually exists in the application. AI is an assistant here — your
            facts, your control, and a working product even when the API is unavailable.
          </p>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          {PRIMARY.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.id} className="card flex flex-col p-5 sm:p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded border border-accent-line bg-accent-soft text-accent">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-inkSoft">{feature.body}</p>
                <p className="mt-3 border-t border-line pt-3 text-xs leading-5 text-muted">{feature.detail}</p>
                <Link to={feature.to} className="btn-link mt-3 self-start">
                  {feature.linkLabel}
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {SECONDARY.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="card flex gap-3.5 p-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded border border-line bg-canvasAlt text-inkSoft">
                  <Icon size={15} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{feature.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
