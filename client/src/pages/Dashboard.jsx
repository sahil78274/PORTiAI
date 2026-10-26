import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  FolderOpen,
  Gauge,
  Globe2,
  LayoutTemplate,
  Newspaper,
  Plus,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import { EmptyState } from '../components/ui/Primitives.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { blogService } from '../services/blogService.js';
import { formatRelative } from '../utils/format.js';
import { getTemplate } from '../utils/templates.js';

const QUICK_LINKS = [
  { label: 'AI Builder', to: '/dashboard/builder', icon: Sparkles, hint: 'Answer questions, get a draft' },
  { label: 'Templates', to: '/dashboard/templates', icon: LayoutTemplate, hint: 'Six layouts to preview' },
  { label: 'Analyzer', to: '/dashboard/analyzer', icon: Gauge, hint: 'Score a portfolio' },
  { label: 'Blog', to: '/dashboard/blog', icon: Newspaper, hint: 'Write and publish posts' },
];

const Thumbnail = ({ portfolio }) => {
  const template = getTemplate(portfolio.templateId);
  const accent = portfolio.accent || template.accent;
  const light = template.tone === 'light';

  return (
    <div
      className="h-[58px] w-[46px] shrink-0 overflow-hidden rounded border border-line"
      style={{ background: light ? '#ffffff' : '#14171c' }}
      aria-hidden="true"
    >
      <div className="space-y-1 p-1.5">
        <div className="h-1 w-5 rounded-sm" style={{ background: light ? '#1a1d21' : '#ffffff', opacity: 0.8 }} />
        <div className="h-[3px] w-7 rounded-sm" style={{ background: accent }} />
        <div className="mt-1.5 h-2 rounded-sm" style={{ background: light ? '#f1f1ec' : '#ffffff1a' }} />
        <div className="h-2 rounded-sm" style={{ background: light ? '#f1f1ec' : '#ffffff1a' }} />
        <div className="h-1 w-4 rounded-sm" style={{ background: light ? '#00000018' : '#ffffff22' }} />
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

  const recent = portfolios.slice(0, 5);
  const draftPosts = posts.filter((post) => !post.published).length;
  const first = user?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-[92px] w-full" />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="skeleton h-[320px]" />
          <div className="skeleton h-[320px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`Signed in as ${user?.name || 'you'}`}
        title={`Welcome back, ${first}`}
        description={
          stats?.total
            ? `${stats.total} portfolio${stats.total === 1 ? '' : 's'}, ${stats.published} published. Pick up where you left off, or start something new.`
            : 'Start from a template or let the AI builder draft your first portfolio. Everything saves to your account as you go.'
        }
        actions={
          <>
            <Link to="/dashboard/create" className="btn-primary btn-sm">
              <Plus size={14} aria-hidden="true" />
              Create portfolio
            </Link>
            <Link to="/dashboard/templates" className="btn-secondary btn-sm">
              Browse templates
            </Link>
          </>
        }
      />

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/30 bg-dangerSoft px-4 py-3 text-[13px] text-danger">
          <span>{error}</span>
          <button type="button" onClick={load} className="btn-secondary btn-sm">
            Try again
          </button>
        </div>
      ) : null}

      {/* Real counts from the account */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {[
          { icon: FolderOpen, label: 'Portfolios', value: stats?.total ?? 0 },
          { icon: Globe2, label: 'Published', value: stats?.published ?? 0 },
          { icon: FileText, label: 'Drafts', value: stats?.drafts ?? 0 },
          { icon: Newspaper, label: 'Blog posts', value: posts.length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white px-4 py-3.5">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
              <Icon size={12} aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {stats?.total === 0 ? (
        <section className="grid gap-6 rounded-lg border border-line bg-white p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Your workspace is empty</h2>
            <p className="mt-1.5 max-w-lg text-[13px] leading-6 text-muted">
              Two ways to start: answer a few questions in the AI builder, or open a template with sample content and
              replace it with your own.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/dashboard/builder" className="btn-primary btn-sm">
                <Sparkles size={13} aria-hidden="true" />
                Start with the builder
              </Link>
              <Link to="/dashboard/templates" className="btn-secondary btn-sm">
                See the templates
              </Link>
            </div>
          </div>
          <ol className="space-y-2 border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {['Choose a template', 'Add your details and projects', 'Preview, then publish a public link'].map((step, index) => (
              <li key={step} className="flex items-start gap-2.5 text-[13px] text-inkSoft">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-[11px] font-medium text-muted">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-lg border border-line bg-white" aria-labelledby="recent-portfolios">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <h2 id="recent-portfolios" className="text-[13px] font-semibold">
              Recent portfolios
            </h2>
            <Link to="/dashboard/portfolios" className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-hover">
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
                        className="truncate text-[13px] font-medium text-ink hover:text-accent"
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

        <div className="space-y-5">
          <section className="rounded-lg border border-line bg-white p-4" aria-labelledby="next-step">
            <h2 id="next-step" className="text-[13px] font-semibold">
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
                <Link to="/dashboard/blog" className="font-medium text-accent hover:text-accent-hover">
                  Open blog
                </Link>
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-line bg-white p-1.5" aria-labelledby="quick-links">
            <h2 id="quick-links" className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">
              Go to
            </h2>
            <ul>
              {QUICK_LINKS.map(({ label, to, icon: Icon, hint }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-center gap-2.5 rounded px-2.5 py-2 transition-colors hover:bg-canvasAlt"
                  >
                    <Icon size={14} className="shrink-0 text-muted" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-ink">{label}</span>
                      <span className="block truncate text-[11px] text-faint">{hint}</span>
                    </span>
                    <ArrowRight size={13} className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
