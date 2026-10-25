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
} from 'lucide-react';
import PortfolioRenderer from '../../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from './TemplatePreviewFrame.jsx';
import { ScoreRing, ProgressBar } from '../ui/Primitives.jsx';
import { demoDashboard, demoPortfolio, demoAnalysis } from '../../utils/demoPortfolio.js';
import { formatRelative } from '../../utils/format.js';
import { getTemplate } from '../../utils/templates.js';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'editor', label: 'Editor', icon: PanelLeft },
  { id: 'review', label: 'AI review', icon: Sparkles },
];

function DashboardPanel() {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Welcome back, Aarav</p>
          <p className="text-xs text-muted">Sample account · 3 portfolios, 2 published</p>
        </div>
        <span className="btn-primary pointer-events-none opacity-90">
          <Plus size={14} aria-hidden="true" /> New portfolio
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {[
          { label: 'Portfolios', value: 3 },
          { label: 'Published', value: 2 },
          { label: 'Drafts', value: 1 },
        ].map((stat) => (
          <div key={stat.label} className="rounded border border-line bg-surface px-3 py-2.5">
            <p className="text-2xs uppercase tracking-widest text-muted">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded border border-line">
        <table className="w-full text-left text-xs">
          <thead className="bg-canvasAlt/70 text-2xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Portfolio</th>
              <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">Template</th>
              <th scope="col" className="px-3 py-2 font-medium">Status</th>
              <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface">
            {demoDashboard.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-2.5">
                  <p className="font-medium text-ink">{row.title}</p>
                  <p className="text-2xs text-muted">{row.projectCount} projects</p>
                </td>
                <td className="hidden px-3 py-2.5 text-inkSoft sm:table-cell">{getTemplate(row.templateId).name}</td>
                <td className="px-3 py-2.5">
                  <span className={row.published ? 'badge-published' : 'badge-draft'}>
                    {row.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="hidden px-3 py-2.5 text-muted sm:table-cell">{formatRelative(row.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-2xs text-faint">Interface preview with sample data.</p>
    </div>
  );
}

function EditorPanel() {
  const [templateId, setTemplateId] = useState('minimal');
  const portfolio = { ...demoPortfolio, templateId };
  return (
    <div className="grid lg:grid-cols-[220px_1fr]">
      <div className="border-b border-line p-3 lg:border-b-0 lg:border-r">
        <p className="text-2xs font-semibold uppercase tracking-widest text-muted">Sections</p>
        <ul className="mt-2 space-y-1 text-xs">
          {['Profile', 'Skills', 'Projects', 'Experience', 'Education', 'Design'].map((item, index) => (
            <li
              key={item}
              className={`flex items-center justify-between rounded px-2 py-1.5 ${
                index === 2 ? 'bg-accent-soft text-accent' : 'text-inkSoft'
              }`}
            >
              <span>{item}</span>
              <FileText size={12} aria-hidden="true" className="opacity-60" />
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-2xs font-semibold uppercase tracking-widest text-muted">Template</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {['minimal', 'developer', 'editorial'].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTemplateId(id)}
                aria-pressed={templateId === id}
                className={`rounded-sm border px-1.5 py-1 text-2xs capitalize ${
                  templateId === id ? 'border-accent bg-accent-soft text-accent' : 'border-lineStrong bg-surface text-inkSoft'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-canvasAlt/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-2xs uppercase tracking-widest text-muted">Live preview</p>
          <span className="badge-draft">Unsaved changes</span>
        </div>
        <div className="overflow-hidden rounded border border-line bg-white">
          <TemplatePreviewFrame designWidth={1000} designHeight={520} label="Editor live preview with sample content">
            <PortfolioRenderer portfolio={portfolio} />
          </TemplatePreviewFrame>
        </div>
        <p className="mt-2 text-2xs text-faint">Template switching is live in this preview; content is sample data.</p>
      </div>
    </div>
  );
}

function ReviewPanel() {
  return (
    <div className="p-4 sm:p-5">
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={demoAnalysis.score} size={124} />
          <span className="badge-draft">Rule-based · sample</span>
        </div>
        <div>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
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

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-line bg-surface p-3">
          <p className="text-2xs font-semibold uppercase tracking-widest text-muted">Detected issues</p>
          <ul className="mt-2 space-y-1.5 text-xs text-inkSoft">
            {demoAnalysis.issues.map((issue) => (
              <li key={issue.id} className="flex gap-2">
                <span
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    issue.severity === 'high' ? 'bg-danger' : issue.severity === 'medium' ? 'bg-warning' : 'bg-lineStrong'
                  }`}
                  aria-hidden="true"
                />
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-line bg-surface p-3">
          <p className="text-2xs font-semibold uppercase tracking-widest text-muted">Prioritised next steps</p>
          <ul className="mt-2 space-y-2 text-xs text-inkSoft">
            {demoAnalysis.recommendations.map((rec) => (
              <li key={rec.title}>
                <p className="font-medium text-ink">{rec.title}</p>
                <p>{rec.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-2xs text-faint">
        Sample analysis for illustration. Scores come from a documented rubric, not a prediction of hiring outcomes.
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
        <h2 id="product-tour-heading" className="mt-2 text-2xl sm:text-3xl">
          The same screens you will use, not a marketing mockup
        </h2>
        <p className="mt-3 text-base leading-7 text-inkSoft">
          These panels use the actual PortiAI components and template renderer, filled with clearly marked sample
          content. What you see here is what the dashboard, editor and analysis pages show after you sign up.
        </p>
      </div>

      <div className="mt-7 overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-canvasAlt/60 px-2 py-1.5">
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
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={13} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pr-1 text-2xs text-muted">
            <ActiveIcon size={12} aria-hidden="true" />
            Sample workspace
          </div>
        </div>

        <div role="tabpanel" aria-label={`${tab} panel`}>
          {tab === 'dashboard' ? <DashboardPanel /> : null}
          {tab === 'editor' ? <EditorPanel /> : null}
          {tab === 'review' ? <ReviewPanel /> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/register" className="btn-primary">
          Create your own workspace
        </Link>
        <Link to="/templates" className="btn-secondary">
          <Eye size={15} aria-hidden="true" /> Browse templates
          <ExternalLink size={13} aria-hidden="true" className="opacity-60" />
        </Link>
      </div>
    </section>
  );
}
