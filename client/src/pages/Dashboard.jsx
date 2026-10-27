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
  Plus,
  Wand2,
} from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import { EmptyState } from '../components/ui/Primitives.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { blogService } from '../services/blogService.js';
import { formatRelative } from '../utils/format.js';
import { getTemplate } from '../utils/templates.js';

const QUICK_ACTIONS = [
  {
    title: 'Create with AI',
    body: 'Answer a few questions and get a draft you can edit.',
    icon: Wand2,
    to: '/dashboard/builder',
  },
  {
    title: 'Browse templates',
    body: 'Six layouts, previewed with real content.',
    icon: LayoutTemplate,
    to: '/dashboard/templates',
  },
  {
    title: 'Analyze portfolio',
    body: 'Score completeness, clarity and contactability.',
    icon: Gauge,
    to: '/dashboard/analyzer',
  },
  {
    title: 'Write a blog post',
    body: 'Draft in Markdown, publish beside your portfolio.',
    icon: Newspaper,
    to: '/dashboard/blog',
  },
];

const Thumbnail = ({ portfolio }) => {
  const template = getTemplate(portfolio.templateId);
  const accent = portfolio.accent || template.accent;
  const light = template.tone === 'light';

  return (
    <div
      className="h-[52px] w-[42px] shrink-0 overflow-hidden rounded border border-line"
      style={{ background: light ? '#ffffff' : '#14171c' }}
      aria-hidden="true"
    >
      <div className="space-y-1 p-1.5">
        <div className="h-1 w-5 rounded-sm" style={{ background: light ? '#1a1d21' : '#ffffff', opacity: 0.8 }} />
        <div className="h-[3px] w-7 rounded-sm" style={{ background: accent }} />
        <div className="mt-1.5 h-2 rounded-sm" style={{ background: light ? '#f1f1ec' : '#ffffff1a' }} />
        <div className="h-2 rounded-sm" style={{ background: light ? '#f1f1ec' : '#ffffff1a' }} />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="space-y-6">
        <div className="skeleton h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton h-[86px]" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="skeleton h-[300px]" />
          <div className="skeleton h-[300px]" />
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
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${first}`}
        description={
          stats?.total
            ? 'Here is where your portfolios and posts stand right now.'
            : 'Start from a template or let the AI builder draft your first portfolio. Everything saves to your account as you go.'
        }
        actions={
          <>
            <Link to="/dashboard/create" className="btn-primary btn-sm">
              <Plus size={14} aria-hidden="true" />
              Create Portfolio
            </Link>
            <Link to="/dashboard/templates" className="btn-secondary btn-sm">
              Templates
            </Link>
          </>
        }
      />

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dangerLine bg-dangerSoft px-4 py-3 text-[13px] text-danger">
          <span>{error}</span>
          <button type="button" onClick={load} className="btn-secondary btn-sm">
            Try again
          </button>
        </div>
      ) : null}

      {/* Real counts from the signed-in account */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-3.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent-hover">
              <Icon size={14} aria-hidden="true" />
            </span>
            <dd className="mt-2.5 text-[22px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-ink">
              {value}
            </dd>
            <dt className="mt-1 text-[11px] font-medium text-muted">{label}</dt>
          </div>
        ))}
      </dl>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions">
        <h2 id="quick-actions" className="text-[13px] font-semibold text-ink">
          Quick actions
        </h2>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map(({ title, body, icon: Icon, to }) => (
            <Link
              key={title}
              to={to}
              className="group rounded-lg border border-line bg-surface p-3.5 transition-colors hover:border-accent-line"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent-hover">
                <Icon size={15} aria-hidden="true" />
              </span>
              <p className="mt-2.5 flex items-center gap-1 text-[13px] font-medium text-ink">
                {title}
                <ArrowRight size={12} className="text-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </p>
              <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{body}</p>
            </Link>
          ))}
        </div>
      </section>

      {stats?.total === 0 ? (
        <section className="grid gap-6 rounded-lg border border-line bg-surface p-5 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Your workspace is empty</h2>
            <p className="mt-1.5 max-w-lg text-[12.5px] leading-6 text-muted">
              Two ways to start: answer a few questions in the AI builder, or open a template with sample content and
              replace it with your own.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/dashboard/builder" className="btn-primary btn-sm">
                Start with the builder
              </Link>
              <Link to="/dashboard/templates" className="btn-secondary btn-sm">
                See the templates
              </Link>
            </div>
          </div>
          <ol className="space-y-2 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {['Choose a template', 'Add your details and projects', 'Preview, then publish a public link'].map((step, index) => (
              <li key={step} className="flex items-start gap-2.5 text-[12.5px] text-inkSoft">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-[10px] font-medium text-muted">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-lg border border-line bg-surface" aria-labelledby="recent-portfolios">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id="recent-portfolios" className="text-[13px] font-semibold text-ink">
              Recent portfolios
            </h2>
            <Link to="/dashboard/portfolios" className="inline-flex items-center gap-1 text-[12px] font-medium text-accent-hover hover:text-ink">
              View all
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-10"
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
            <ul className="divide-y divide-line">
              {recent.map((portfolio) => (
                <li key={portfolio.id} className="flex items-center gap-3 px-4 py-3">
                  <Thumbnail portfolio={portfolio} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/dashboard/portfolio/${portfolio.id}/edit`}
                        className="truncate text-[13px] font-medium text-ink hover:text-accent-hover"
                      >
                        {portfolio.title}
                      </Link>
                      <span className={portfolio.published ? 'badge-published' : 'badge-draft'}>
                        {portfolio.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {getTemplate(portfolio.templateId).name} · updated {formatRelative(portfolio.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {portfolio.published && portfolio.slug ? (
                      <a
                        href={`/p/${portfolio.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary btn-sm"
                        title="Open the public page"
                      >
                        <Eye size={12} aria-hidden="true" />
                        View
                      </a>
                    ) : null}
                    <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="btn-secondary btn-sm">
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-line bg-surface p-4" aria-labelledby="next-step">
          <h2 id="next-step" className="text-[13px] font-semibold text-ink">
            Next step
          </h2>
          {portfolios[0] ? (
            <>
              <p className="mt-1.5 text-[12px] leading-6 text-muted">
                {portfolios[0].hasAnalysis
                  ? `“${portfolios[0].title}” scored ${portfolios[0].analysisScore}/100. Work through the highest-severity issues, then rescan.`
                  : `“${portfolios[0].title}” has not been analysed. A scan lists what to fix before you share the link.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
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
            <div className="mt-2 flex items-start gap-2 text-[12px] text-muted">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              Create a portfolio and the next suggested action appears here.
            </div>
          )}

          {draftPosts ? (
            <p className="mt-3 border-t border-line pt-3 text-[12px] text-muted">
              {draftPosts} unpublished blog post{draftPosts === 1 ? '' : 's'}.{' '}
              <Link to="/dashboard/blog" className="font-medium text-accent-hover hover:text-ink">
                Open blog
              </Link>
            </p>
          ) : null}

          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-5 text-faint">
            Counts come from your own account records — nothing on this page is illustrative.
          </p>
        </section>
      </div>
    </div>
  );
}
