import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PanelLeft,
  Sparkles,
  Eye,
  ExternalLink,
  FileText,
  Plus,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import { ScoreRing, ProgressBar } from '../ui/Primitives.jsx';
import { demoDashboard, demoPortfolio, demoAnalysis } from '../../utils/demoPortfolio.js';
import { formatRelative } from '../../utils/format.js';
import { getTemplate } from '../../utils/templates.js';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'editor', label: 'Visual editor', icon: PanelLeft },
  { id: 'review', label: 'Rubric & AI review', icon: Sparkles },
];

function DashboardPanel() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-ink">Welcome back, Aarav</p>
          <p className="text-xs text-muted">Sample account · 3 portfolios created · 2 published</p>
        </div>
        <span className="btn-primary btn-sm pointer-events-none opacity-90">
          <Plus size={13} aria-hidden="true" /> New portfolio
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Portfolios', value: 3, helper: 'All projects' },
          { label: 'Published', value: 2, helper: 'Live public URLs' },
          { label: 'Drafts', value: 1, helper: 'In editing' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface p-3.5 shadow-xs">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{stat.value}</p>
            <p className="mt-0.5 text-2xs text-slate-400">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-line shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-2xs uppercase tracking-wider text-muted border-b border-line">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">Portfolio</th>
              <th scope="col" className="hidden px-4 py-2.5 font-semibold sm:table-cell">Template</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
              <th scope="col" className="hidden px-4 py-2.5 font-semibold sm:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {demoDashboard.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{row.title}</p>
                  <p className="text-2xs text-muted">{row.projectCount} project entries</p>
                </td>
                <td className="hidden px-4 py-3 text-inkSoft sm:table-cell font-medium">
                  {getTemplate(row.templateId).name}
                </td>
                <td className="px-4 py-3">
                  <span className={row.published ? 'badge-published' : 'badge-draft'}>
                    {row.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-muted sm:table-cell">{formatRelative(row.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center text-2xs text-slate-400">Sample account data for preview purposes.</p>
    </div>
  );
}

function EditorPanel() {
  const [templateId, setTemplateId] = useState('minimal');
  const templateObj = getTemplate(templateId);
  const portfolio = {
    ...demoPortfolio,
    templateId,
    theme: { ...demoPortfolio.theme, accent: templateObj.accent },
  };

  return (
    <div className="grid lg:grid-cols-[240px_1fr]">
      <div className="border-b border-line p-4 lg:border-b-0 lg:border-r">
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Sections</p>
        <ul className="mt-2.5 space-y-1 text-xs">
          {['Profile', 'Skills', 'Projects', 'Experience', 'Education', 'Design'].map((item, index) => (
            <li
              key={item}
              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                index === 2 ? 'bg-accent-soft text-accent font-semibold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{item}</span>
              <FileText size={12} aria-hidden="true" className="opacity-60" />
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-line pt-3.5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Switch template</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['minimal', 'developer', 'editorial'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTemplateId(id)}
                aria-pressed={templateId === id}
                className={`rounded-md border px-2 py-1 text-2xs font-medium capitalize transition-all ${
                  templateId === id
                    ? 'border-accent bg-accent text-white shadow-xs'
                    : 'border-line bg-white text-slate-600 hover:border-lineStrong'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-100/60 p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-2xs font-semibold uppercase tracking-widest text-slate-500">Live editor output</p>
          <span className="badge-draft">Instant sync</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <TemplatePreviewFrame designWidth={1000} designHeight={520} label="Editor live preview with sample content">
            <PortfolioRenderer portfolio={portfolio} />
          </TemplatePreviewFrame>
        </div>
        <p className="mt-2.5 text-center text-2xs text-slate-400">Switching templates preserves your text and layout structure.</p>
      </div>
    </div>
  );
}

function ReviewPanel() {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-slate-50/50 p-4">
          <ScoreRing score={demoAnalysis.score} size={118} />
          <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700 font-medium">100-pt rubric</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink">Rubric Category Breakdown</h3>
          <p className="text-xs text-muted mb-3">Objective criteria scored independently across 7 core areas.</p>
          <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {demoAnalysis.categories.map((category) => (
              <ProgressBar
                key={category.id}
                label={category.label}
                value={category.score}
                max={category.max}
                tone={category.score / category.max >= 0.8 ? 'success' : category.score / category.max >= 0.6 ? 'accent' : 'warning'}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Detected issues</p>
          <ul className="mt-2.5 space-y-2 text-xs text-inkSoft">
            {demoAnalysis.issues.map((issue) => (
              <li key={issue.id} className="flex gap-2 items-start">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    issue.severity === 'high' ? 'bg-danger' : issue.severity === 'medium' ? 'bg-warning' : 'bg-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Actionable suggestions</p>
          <ul className="mt-2.5 space-y-2.5 text-xs text-inkSoft">
            {demoAnalysis.recommendations.map((rec) => (
              <li key={rec.title}>
                <p className="font-semibold text-ink">{rec.title}</p>
                <p className="text-muted leading-relaxed">{rec.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-center text-2xs text-slate-400">
        Deterministic rubric scoring ensures reproducible, fair evaluation regardless of AI availability.
      </p>
    </div>
  );
}

/** Product tour: three real interface panels with sample data. */
export default function ProductTour() {
  const [tab, setTab] = useState('dashboard');
  const ActiveIcon = TABS.find((item) => item.id === tab)?.icon || LayoutDashboard;

  return (
    <section className="container-page py-16 sm:py-20" aria-labelledby="product-tour-heading">
      <div className="max-w-2xl">
        <p className="eyebrow">Inside the product</p>
        <h2 id="product-tour-heading" className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          The same screens you use, not marketing mockups
        </h2>
        <p className="mt-3 text-base leading-relaxed text-inkSoft">
          These interactive panels run the actual PortiAI components and template renderer with clearly marked sample
          content. What you see is what you get when building your portfolio.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-raised">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-slate-50/80 px-3 py-2">
          <div className="flex gap-1" role="tablist" aria-label="Product screens">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight transition-all ${
                    active ? 'bg-white text-ink shadow-xs ring-1 ring-slate-200' : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="hidden items-center gap-1.5 pr-2 text-2xs font-medium text-slate-500 sm:flex">
            <ActiveIcon size={13} aria-hidden="true" />
            <span>Interactive preview</span>
          </div>
        </div>

        <div role="tabpanel" aria-label={`${tab} panel`}>
          {tab === 'dashboard' ? <DashboardPanel /> : null}
          {tab === 'editor' ? <EditorPanel /> : null}
          {tab === 'review' ? <ReviewPanel /> : null}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/register" className="btn-primary">
          <span>Create your workspace</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
        <Link to="/templates" className="btn-secondary">
          <Eye size={14} aria-hidden="true" />
          <span>Browse templates</span>
        </Link>
      </div>
    </section>
  );
}
