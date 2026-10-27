import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  FileText,
  FolderOpen,
  Gauge,
  Globe2,
  LayoutTemplate,
  Newspaper,
  Pencil,
  Plus,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { EmptyState } from '../components/ui/Primitives.jsx';
import PortfolioThumb from '../components/dashboard/PortfolioThumb.jsx';
import useAiStatus from '../hooks/useAiStatus.js';
import { useAuth } from '../context/AuthContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { blogService } from '../services/blogService.js';
import { formatRelative } from '../utils/format.js';
import { getTemplate } from '../utils/templates.js';

// The three primary ways to start, shown prominently.
const QUICK_ACTIONS = [
  {
    title: 'Create a portfolio',
    body: 'Start a new project from scratch or a starting point.',
    icon: Plus,
    to: '/dashboard/create',
    primary: true,
  },
  {
    title: 'Use a template',
    body: 'Six layouts, previewed with real content.',
    icon: LayoutTemplate,
    to: '/dashboard/templates',
  },
  {
    title: 'Generate with AI',
    body: 'Answer a few questions and get a draft you can edit.',
    icon: Sparkles,
    to: '/dashboard/builder',
  },
];

// Existing AI-assisted features in the product, each linking to where it lives.
const AI_TOOLS = [
  {
    title: 'AI portfolio builder',
    body: 'A guided conversation that drafts editable portfolio copy from your real details.',
    icon: Wand2,
    to: '/dashboard/builder',
    cta: 'Open builder',
  },
  {
    title: 'Portfolio analyzer',
    body: 'Score completeness, clarity and contactability, then fix the highest-impact issues.',
    icon: Gauge,
    to: '/dashboard/analyzer',
    cta: 'Run analysis',
  },
  {
    title: 'Blog writing',
    body: 'Draft Markdown posts and publish them beside your portfolio.',
    icon: Newspaper,
    to: '/dashboard/blog',
    cta: 'Write a post',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { status: aiStatus } = useAiStatus();

  const load = useCallback(async () => {
    setError('');
    try {
      const [portfolioData, blogData] = await Promise.all([
        portfolioService.list({ sort: 'updated' }),
        blogService.list({}).catch(() => ({ posts: [] })),
      ]);
      setPortfolios(portfolioData.portfolios || []);
      setStats(portfolioData.stats || { total: 0, published: 0, drafts: 0 });
      setPosts(blogData.posts || []);
    } catch (err) {
      setError(err.message || 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recent = portfolios.slice(0, 4);
  const draftPosts = posts.filter((post) => !post.published).length;
  const first = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="space-y-7" aria-busy="true">
        <div className="skeleton h-[188px] rounded-card" />
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton h-[92px] rounded-card" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="skeleton h-[320px] rounded-card" />
          <div className="skeleton h-[320px] rounded-card" />
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: FolderOpen, label: 'Total portfolios', value: stats?.total ?? 0 },
    { icon: Globe2, label: 'Published', value: stats?.published ?? 0 },
    { icon: FileText, label: 'Drafts', value: stats?.drafts ?? 0 },
    { icon: Newspaper, label: 'Blog posts', value: posts.length },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="card relative overflow-hidden p-6 sm:p-8" aria-labelledby="welcome-title">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-canvas shadow-neu-inset" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-2 top-16 hidden h-28 w-28 rounded-full bg-surface shadow-neu md:block" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="eyebrow">Your workspace</p>
          <h1 id="welcome-title" className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-[32px]">
            {greeting}, {first}
          </h1>
          <p className="mt-2.5 max-w-xl text-[14px] leading-6 text-muted">
            {stats?.total
              ? 'Here is where your portfolios and posts stand right now. Pick up where you left off or start something new.'
              : 'Start from a template or let the AI builder draft your first portfolio. Everything saves to your account as you go.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard/create" className="btn-primary">
              <Plus size={15} aria-hidden="true" />
              Create Portfolio
            </Link>
            <Link to="/dashboard/builder" className="btn-secondary">
              <Sparkles size={15} aria-hidden="true" />
              Generate with AI
            </Link>
            <Link to="/dashboard/templates" className="btn-ghost">
              Templates
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-tile bg-dangerSoft px-4 py-3 text-[13px] text-danger shadow-neu-inset-xs">
          <span>{error}</span>
          <button type="button" onClick={load} className="btn-secondary btn-sm">
            Try again
          </button>
        </div>
      ) : null}

      {/* Real counts from the signed-in account */}
      <dl className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {statCards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="card flex items-center gap-3.5 p-4 sm:p-5">
            <span className="icon-tile h-11 w-11">
              <Icon size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dd className="text-[24px] font-bold tabular-nums leading-none tracking-[-0.02em] text-ink">{value}</dd>
              <dt className="mt-1.5 text-[12px] font-medium leading-4 text-muted">{label}</dt>
            </div>
          </div>
        ))}
      </dl>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="text-[15px] font-semibold text-ink">
          Quick actions
        </h2>
        <div className="mt-4 grid gap-4 sm:gap-5 md:grid-cols-3">
          {QUICK_ACTIONS.map(({ title, body, icon: Icon, to, primary }) => (
            <Link key={title} to={to} className="card-link group flex items-center gap-4 p-5">
              <span className={primary ? 'icon-tile-accent h-12 w-12' : 'icon-tile h-12 w-12'}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[14px] font-semibold text-ink">
                  {title}
                </span>
                <span className="mt-0.5 block text-[12px] leading-5 text-muted">{body}</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-faint transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-accent-hover" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {stats?.total === 0 ? (
        <section className="panel grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.3fr_1fr] lg:items-center" aria-labelledby="empty-title">
          <div>
            <h2 id="empty-title" className="text-[16px] font-semibold text-ink">Your workspace is empty</h2>
            <p className="mt-1.5 max-w-lg text-[13px] leading-6 text-muted">
              Two ways to start: answer a few questions in the AI builder, or open a template with sample content and
              replace it with your own.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/dashboard/builder" className="btn-primary btn-sm">
                <Sparkles size={13} aria-hidden="true" />
                Start with the builder
              </Link>
              <Link to="/dashboard/templates" className="btn-secondary btn-sm">
                See the templates
              </Link>
            </div>
          </div>
          <ol className="space-y-3">
            {['Choose a template', 'Add your details and projects', 'Preview, then publish a public link'].map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-[13px] font-medium text-inkSoft">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-surface text-[12px] font-semibold text-accent-hover shadow-neu-sm">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent portfolios */}
        <section className="card p-5 sm:p-6" aria-labelledby="recent-portfolios">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recent-portfolios" className="text-[15px] font-semibold text-ink">
              Recent portfolios
            </h2>
            <Link to="/dashboard/portfolios" className="btn-ghost btn-sm text-accent-hover">
              View all
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              className="mt-4 py-10"
              icon={FolderOpen}
              title="No portfolios yet"
              description="Your drafts and published pages will be listed here."
              action={
                <Link to="/dashboard/create" className="btn-primary btn-sm">
                  <Plus size={13} aria-hidden="true" />
                  Create portfolio
                </Link>
              }
            />
          ) : (
            <ul className="mt-4 grid gap-5 sm:grid-cols-2">
              {recent.map((portfolio) => (
                <li key={portfolio.id} className="neu-raised-sm flex flex-col rounded-[18px] p-3">
                  <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="block rounded-[16px]" tabIndex={-1} aria-hidden="true">
                    <PortfolioThumb portfolio={portfolio} />
                  </Link>
                  <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/dashboard/portfolio/${portfolio.id}/edit`}
                        className="min-w-0 truncate text-[14px] font-semibold text-ink hover:text-accent-hover"
                      >
                        {portfolio.title}
                      </Link>
                      <span className={`shrink-0 ${portfolio.published ? 'badge-published' : 'badge-draft'}`}>
                        {portfolio.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11.5px] text-muted">
                      {getTemplate(portfolio.templateId).name} · updated {formatRelative(portfolio.updatedAt)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="btn-secondary btn-sm flex-1">
                        <Pencil size={12} aria-hidden="true" />
                        Edit
                      </Link>
                      {portfolio.published && portfolio.slug ? (
                        <a
                          href={`/p/${portfolio.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline btn-sm flex-1"
                          title="Open the public page"
                        >
                          <Eye size={12} aria-hidden="true" />
                          View
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* Next step */}
          <section className="card p-5 sm:p-6" aria-labelledby="next-step">
            <div className="flex items-center gap-3">
              <span className="icon-tile">
                <CheckCircle2 size={16} aria-hidden="true" />
              </span>
              <h2 id="next-step" className="text-[15px] font-semibold text-ink">
                Next step
              </h2>
            </div>
            {portfolios[0] ? (
              <>
                <p className="mt-3 text-[12.5px] leading-6 text-muted">
                  {portfolios[0].hasAnalysis
                    ? `“${portfolios[0].title}” scored ${portfolios[0].analysisScore}/100. Work through the highest-severity issues, then rescan.`
                    : `“${portfolios[0].title}” has not been analysed. A scan lists what to fix before you share the link.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link to={`/dashboard/portfolio/${portfolios[0].id}/analyze`} className="btn-primary btn-sm">
                    <Gauge size={13} aria-hidden="true" />
                    {portfolios[0].hasAnalysis ? 'Review analysis' : 'Run analysis'}
                  </Link>
                  {!portfolios[0].published ? (
                    <Link to={`/dashboard/portfolio/${portfolios[0].id}/edit`} className="btn-secondary btn-sm">
                      Continue editing
                    </Link>
                  ) : (
                    <a
                      href={`/p/${portfolios[0].slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary btn-sm"
                    >
                      View public page
                    </a>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-3 text-[12.5px] leading-6 text-muted">
                Create a portfolio and the next suggested action appears here.
              </p>
            )}

            {draftPosts ? (
              <p className="mt-4 border-t border-line pt-3 text-[12px] text-muted">
                {draftPosts} unpublished blog post{draftPosts === 1 ? '' : 's'}.{' '}
                <Link to="/dashboard/blog" className="font-semibold text-accent-hover hover:text-ink">
                  Open blog
                </Link>
              </p>
            ) : null}

            <p className="mt-4 border-t border-line pt-3 text-[11px] leading-5 text-faint">
              Counts come from your own account records — nothing on this page is illustrative.
            </p>
          </section>
        </div>
      </div>

      {/* AI tools */}
      <section aria-labelledby="ai-tools">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="ai-tools" className="text-[15px] font-semibold text-ink">
              AI tools
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">AI only works from facts you provide, and every result stays editable.</p>
          </div>
          {aiStatus ? (
            <span className={aiStatus.configured ? 'badge-published' : 'badge bg-warningSoft text-warning'}>
              <span className={`h-1.5 w-1.5 rounded-full ${aiStatus.configured ? 'bg-success' : 'bg-warning'}`} aria-hidden="true" />
              {aiStatus.configured ? 'AI available' : 'AI not configured on this server'}
            </span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 sm:gap-5 md:grid-cols-3">
          {AI_TOOLS.map(({ title, body, icon: Icon, to, cta }) => (
            <div key={title} className="card flex flex-col p-5">
              <span className="icon-tile h-11 w-11">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[14px] font-semibold text-ink">{title}</h3>
              <p className="mt-1 flex-1 text-[12.5px] leading-6 text-muted">{body}</p>
              <Link to={to} className="btn-link mt-3 text-[13px]">
                {cta}
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
