import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
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
  TrendingUp,
  Rocket,
} from 'lucide-react';
import { PageHeader, StatCard } from '../components/ui/Kit.jsx';
import { Button, EmptyState } from '../components/ui/Primitives.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { blogService } from '../services/blogService.js';
import { formatRelative } from '../utils/format.js';
import { getTemplate } from '../utils/templates.js';

const QUICK_ACTIONS = [
  {
    title: 'Create with AI',
    description: 'Chat through your background and get a full draft in minutes.',
    icon: Sparkles,
    to: '/dashboard/builder',
    cta: 'Open builder',
    tone: 'from-brand-indigo/30',
  },
  {
    title: 'Browse templates',
    description: 'Preview nine complete design systems with sample content.',
    icon: LayoutTemplate,
    to: '/dashboard/templates',
    cta: 'View gallery',
    tone: 'from-brand-violet/30',
  },
  {
    title: 'Analyze portfolio',
    description: 'Score completeness, clarity and contactability — or scan a live URL.',
    icon: Gauge,
    to: '/dashboard/analyzer',
    cta: 'Run analysis',
    tone: 'from-brand-blue/30',
  },
  {
    title: 'Write a blog post',
    description: 'Draft in Markdown, use AI help, then publish to your portfolio.',
    icon: Newspaper,
    to: '/dashboard/blog/new',
    cta: 'Start writing',
    tone: 'from-emerald-500/30',
  },
];

const Thumbnail = ({ portfolio }) => {
  const template = getTemplate(portfolio.templateId);
  const accent = portfolio.accent || template.accent;
  const light = template.tone === 'light';

  return (
    <div
      className="relative h-[72px] w-[104px] shrink-0 overflow-hidden rounded-lg border border-white/10"
      style={{ background: light ? '#f7f6f2' : '#080b14' }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-95" style={{ background: `radial-gradient(circle at 82% 18%, ${accent}55, transparent 60%)` }} />
      <div className="absolute inset-3 space-y-1.5">
        <div className="h-1.5 w-9 rounded-full" style={{ background: light ? '#14181f' : '#ffffff', opacity: light ? 0.85 : 0.75 }} />
        <div className="h-1 w-14 rounded-full" style={{ background: accent, opacity: 0.9 }} />
        <div className="mt-2 grid grid-cols-2 gap-1">
          <div className="h-4 rounded-sm" style={{ background: light ? '#ffffff' : '#ffffff14', border: `1px solid ${light ? '#00000010' : '#ffffff18'}` }} />
          <div className="h-4 rounded-sm" style={{ background: light ? '#ffffff' : '#ffffff14', border: `1px solid ${light ? '#00000010' : '#ffffff18'}` }} />
        </div>
        <div className="h-1 w-10 rounded-full" style={{ background: light ? '#00000018' : '#ffffff22' }} />
      </div>
      <span className="absolute bottom-1 right-1.5 text-[7px] font-medium uppercase tracking-wider" style={{ color: light ? '#00000055' : '#ffffff55' }}>
        {template.name.split(' ')[0]}
      </span>
    </div>
  );
};

export default function Dashboard() {
  const { user, refresh } = useAuth();
  const toast = useToast();
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

  const activity = useMemo(() => {
    const events = [];
    portfolios.forEach((portfolio) => {
      events.push({
        id: `p-${portfolio.id}-updated`,
        icon: Pencil,
        text: `Updated “${portfolio.title}”`,
        at: portfolio.updatedAt,
        to: `/dashboard/portfolio/${portfolio.id}/edit`,
      });
      if (portfolio.published && portfolio.publishedAt) {
        events.push({
          id: `p-${portfolio.id}-published`,
          icon: Globe2,
          text: `Published “${portfolio.title}”`,
          at: portfolio.publishedAt,
          to: `/p/${portfolio.slug}`,
          external: true,
        });
      }
    });
    posts.forEach((post) => {
      events.push({
        id: `b-${post.id}`,
        icon: Newspaper,
        text: post.published ? `Published post “${post.title}”` : `Draft post “${post.title}”`,
        at: post.updatedAt,
        to: `/dashboard/blog/${post.id}`,
      });
    });
    return events
      .filter((event) => event.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 6);
  }, [portfolios, posts]);

  const first = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton h-[116px]" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="skeleton h-[320px]" />
          <div className="skeleton h-[320px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={`${greeting}, ${first}`}
        title="Your portfolio workspace"
        description={
          stats?.total
            ? `${stats.total} portfolio${stats.total === 1 ? '' : 's'} in your workspace · ${stats.published} published · ${stats.drafts} draft${stats.drafts === 1 ? '' : 's'} · ${posts.length} blog post${posts.length === 1 ? '' : 's'}.`
            : 'Start with the AI builder, or pick a template and add your content. Everything is saved to your account as you go.'
        }
        actions={
          <>
            <Link to="/dashboard/builder" className="btn-primary btn-sm">
              <Plus size={14} aria-hidden="true" />
              New portfolio
            </Link>
            <Link to="/dashboard/analyzer" className="btn-secondary btn-sm">
              <Gauge size={14} aria-hidden="true" />
              Analyze
            </Link>
          </>
        }
      />

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-dangerSoft p-4 text-sm text-danger">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FolderOpen} label="Total portfolios" value={stats?.total ?? 0} hint="Across all templates" tone="indigo" />
        <StatCard icon={Globe2} label="Published" value={stats?.published ?? 0} hint="Live public links" tone="blue" />
        <StatCard icon={FileText} label="Drafts" value={stats?.drafts ?? 0} hint="Only visible to you" tone="violet" />
        <StatCard icon={Newspaper} label="Blog posts" value={posts.length} hint={`${posts.filter((post) => post.published).length} published`} tone="emerald" />
      </div>

      {/* Onboarding */}
      {stats?.total === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-accent-line/40 bg-gradient-to-br from-accent-soft via-surfaceRaised/60 to-surface p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-violet/25 blur-3xl" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-inkSoft">
                <Rocket size={11} aria-hidden="true" />
                Start here
              </span>
              <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">Build your first portfolio in about five minutes</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                The AI builder interviews you about your role, projects, skills and experience, then drafts editable
                content. You choose a design, preview it live and publish when it feels right.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link to="/dashboard/builder" className="btn-primary btn-sm">
                  <Sparkles size={14} aria-hidden="true" />
                  Start with AI
                </Link>
                <Link to="/dashboard/templates" className="btn-secondary btn-sm">
                  <LayoutTemplate size={14} aria-hidden="true" />
                  Pick a template
                </Link>
              </div>
            </div>
            <ol className="space-y-3">
              {[
                'Answer a few questions about your work',
                'Choose one of nine designs',
                'Edit, analyse and publish',
              ].map((step, index) => (
                <li key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070b18]/50 px-3.5 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-xs text-inkSoft">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.map(({ title, description, icon: Icon, to, cta, tone }) => (
          <Link
            key={title}
            to={to}
            className="card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-lineStrong hover:bg-surfaceRaised/80"
          >
            <div className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tone} to-transparent blur-2xl`} aria-hidden="true" />
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-accent-hover">
              <Icon size={17} aria-hidden="true" />
            </span>
            <p className="relative mt-3.5 text-sm font-semibold text-white">{title}</p>
            <p className="relative mt-1 text-xs leading-relaxed text-muted">{description}</p>
            <span className="relative mt-4 inline-flex items-center gap-1 text-2xs font-semibold text-accent-hover">
              {cta}
              <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        {/* Recent portfolios */}
        <section className="card p-5" aria-labelledby="recent-portfolios">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recent-portfolios" className="text-sm font-semibold text-white">
              Recent portfolios
            </h2>
            <Link to="/dashboard/portfolios" className="inline-flex items-center gap-1 text-2xs font-semibold text-accent-hover hover:text-white">
              View all
              <ArrowUpRight size={11} aria-hidden="true" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              className="mt-4 border-0 bg-transparent py-10"
              icon={FolderOpen}
              title="No portfolios yet"
              description="Your first draft will appear here with its template and status."
              action={
                <Link to="/dashboard/builder" className="btn-primary btn-sm">
                  <Sparkles size={13} aria-hidden="true" />
                  Create with AI
                </Link>
              }
            />
          ) : (
            <ul className="mt-4 space-y-2">
              {recent.map((portfolio) => (
                <li key={portfolio.id}>
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvasAlt/50 p-3 transition-colors hover:border-lineStrong hover:bg-surfaceRaised/60">
                    <Thumbnail portfolio={portfolio} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="truncate text-sm font-semibold text-white hover:text-accent-hover">
                          {portfolio.title}
                        </Link>
                        <span className={portfolio.published ? 'badge-published' : 'badge-draft'}>
                          {portfolio.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-2xs text-muted">
                        {getTemplate(portfolio.templateId).name} · {portfolio.projectCount} project
                        {portfolio.projectCount === 1 ? '' : 's'} · updated {formatRelative(portfolio.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {portfolio.published && portfolio.slug ? (
                        <a href={`/p/${portfolio.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost h-8 w-8 p-0" aria-label={`Open ${portfolio.title}`} title="Open public page">
                          <Eye size={14} aria-hidden="true" />
                        </a>
                      ) : null}
                      <Link to={`/dashboard/portfolio/${portfolio.id}/edit`} className="btn-secondary btn-sm">
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activity + score */}
        <div className="space-y-5">
          <section className="card p-5" aria-labelledby="recent-activity">
            <h2 id="recent-activity" className="text-sm font-semibold text-white">
              Recent activity
            </h2>
            {activity.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-lineStrong/60 px-4 py-8 text-center">
                <Clock size={18} className="mx-auto text-faint" aria-hidden="true" />
                <p className="mt-2 text-xs text-muted">Nothing has happened yet. Create or edit a portfolio to start your timeline.</p>
              </div>
            ) : (
              <ol className="mt-4 space-y-3">
                {activity.map(({ id, icon: Icon, text, at, to, external }) => (
                  <li key={id} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-accent-hover">
                      <Icon size={12} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      {external ? (
                        <a href={to} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-inkSoft hover:text-white">
                          {text}
                        </a>
                      ) : (
                        <Link to={to} className="text-xs font-medium text-inkSoft hover:text-white">
                          {text}
                        </Link>
                      )}
                      <p className="text-[11px] text-faint">{formatRelative(at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card overflow-hidden p-5" aria-labelledby="next-steps">
            <h2 id="next-steps" className="text-sm font-semibold text-white">Suggested next step</h2>
            {portfolios[0] ? (
              <>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {portfolios[0].hasAnalysis
                    ? `“${portfolios[0].title}” scored ${portfolios[0].analysisScore}/100. Fix the highest-severity issues, then rescan.`
                    : `“${portfolios[0].title}” has not been analysed yet. A scan takes a few seconds and lists exactly what to fix.`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/dashboard/portfolio/${portfolios[0].id}/analyze`} className="btn-primary btn-sm">
                    <Gauge size={13} aria-hidden="true" />
                    {portfolios[0].hasAnalysis ? 'Review analysis' : 'Analyze now'}
                  </Link>
                  {!portfolios[0].published ? (
                    <Link to={`/dashboard/portfolio/${portfolios[0].id}/edit`} className="btn-secondary btn-sm">
                      <Rocket size={13} aria-hidden="true" />
                      Finish & publish
                    </Link>
                  ) : (
                    <a href={`/p/${portfolios[0].slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                      <Eye size={13} aria-hidden="true" />
                      View public page
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-3 flex items-start gap-2 text-xs text-muted">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                Create a portfolio and PortiAI will suggest the next improvement here.
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-canvasDeep/40 px-3 py-2 text-[11px] text-faint">
              <TrendingUp size={12} className="text-success" aria-hidden="true" />
              Stats above come directly from your account records.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
