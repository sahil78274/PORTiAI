import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Globe2,
  LayoutDashboard,
  Loader2,
  Mail,
  Newspaper,
  Pencil,
  Share2,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { Button } from '../components/ui/Primitives.jsx';
import { SmartImage } from '../components/ui/Kit.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { blogService } from '../services/blogService.js';
import { getTemplate } from '../utils/templates.js';
import { formatRelative, wordCount } from '../utils/format.js';

export default function PublishSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [portfolio, setPortfolio] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await portfolioService.get(id);
      setPortfolio(data.portfolio);
      if (data.portfolio.blog?.enabled) {
        try {
          const blogData = await blogService.list({ portfolioId: data.portfolio.id, status: 'all' });
          setPosts(blogData.posts || []);
        } catch {
          setPosts([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load this portfolio.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const publicPath = portfolio?.slug ? `/p/${portfolio.slug}` : '';
  const publicUrl = publicPath ? `${window.location.origin}${publicPath}` : '';
  const template = portfolio ? getTemplate(portfolio.templateId) : null;

  const checklist = useMemo(() => {
    if (!portfolio) return [];
    const profile = portfolio.profile || {};
    const socials = Object.values(portfolio.socialLinks || {}).filter(Boolean);
    return [
      { label: 'Public URL is live', done: Boolean(portfolio.published && portfolio.slug), detail: publicUrl || 'Publish to generate a link.' },
      { label: 'Name and role set', done: Boolean(profile.fullName && profile.title), detail: profile.fullName ? `${profile.fullName}${profile.title ? ` · ${profile.title}` : ''}` : 'Add your name and role in the editor.' },
      { label: 'About summary', done: Boolean((profile.summary || profile.bio || '').trim()), detail: 'Summaries help visitors and search engines understand you.' },
      { label: 'At least three skills', done: (portfolio.skills?.length || 0) >= 3, detail: `${portfolio.skills?.length || 0} listed` },
      { label: 'A project with a link', done: (portfolio.projects || []).some((project) => project.projectUrl || project.githubUrl), detail: 'Projects with live links convert best.' },
      { label: 'Contact route', done: Boolean(profile.contactEmail || socials.length), detail: 'Email or a social profile so people can reach you.' },
      { label: 'Blog page', done: Boolean(portfolio.blog?.enabled && posts.some((post) => post.published)), detail: portfolio.blog?.enabled ? `${posts.filter((post) => post.published).length} published post(s)` : 'Optional — enable it in the editor.' },
    ];
  }, [portfolio, posts, publicUrl]);

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Public link copied.');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.info('Copy this link manually:', { description: publicUrl, duration: 9000 });
    }
  };

  const share = async () => {
    if (!publicUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: portfolio?.title || 'My portfolio',
          text: `${portfolio?.profile?.fullName || 'My'} portfolio, built with PortiAI.`,
          url: publicUrl,
        });
        return;
      } catch {
        // user dismissed the share sheet — fall through to copy
      }
    }
    copyLink();
  };

  const unpublish = async () => {
    setUnpublishing(true);
    try {
      await portfolioService.setPublished(id, false);
      toast.success('Portfolio unpublished. The public URL is no longer accessible.');
      navigate(`/dashboard/portfolio/${id}/edit`);
    } catch (err) {
      toast.error(err.message || 'Could not unpublish the portfolio.');
    } finally {
      setUnpublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-accent-hover" aria-hidden="true" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-lg font-bold text-white">Portfolio not found</h1>
        <p className="mt-2 text-sm text-muted">{error || 'This portfolio does not exist or belongs to another account.'}</p>
        <Link to="/dashboard/portfolios" className="btn-primary mt-5">
          Back to my portfolios
        </Link>
      </div>
    );
  }

  const notPublished = !portfolio.published;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface/70 p-6 sm:p-9">
        <div
          className="pointer-events-none absolute inset-x-0 -top-32 h-64 opacity-70"
          style={{ background: 'radial-gradient(ellipse 500px 240px at 50% 0%, rgba(99,102,241,0.4), transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="relative text-center">
          <span
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              notPublished ? 'border border-warning/30 bg-warningSoft text-warning' : 'bg-brand-gradient text-white shadow-glow'
            }`}
          >
            {notPublished ? <Undo2 size={26} aria-hidden="true" /> : <CheckCircle2 size={28} aria-hidden="true" />}
          </span>
          <h1 className="mt-5 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {notPublished ? 'This portfolio is currently a draft' : 'Your portfolio is live'}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {notPublished
              ? 'Publish it from the editor to make the public link reachable. Drafts are private to your account and never indexed.'
              : `Anyone with the link can now view your portfolio. It renders from your saved content with the ${template?.name || 'selected'} template.`}
          </p>

          {publicUrl ? (
            <div className="mx-auto mt-5 flex max-w-xl flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-canvasDeep px-3.5 py-2.5">
                <Globe2 size={14} className="shrink-0 text-faint" aria-hidden="true" />
                <span className="truncate font-mono text-xs text-inkSoft">{publicUrl}</span>
              </div>
              <Button onClick={copyLink} className="shrink-0">
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {portfolio.published ? (
              <a href={publicPath} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                <ExternalLink size={13} aria-hidden="true" />
                Open portfolio
              </a>
            ) : (
              <Link to={`/dashboard/portfolio/${id}/edit`} className="btn-primary btn-sm">
                <Pencil size={13} aria-hidden="true" />
                Open editor to publish
              </Link>
            )}
            <button type="button" onClick={share} className="btn-secondary btn-sm" disabled={!publicUrl}>
              <Share2 size={13} aria-hidden="true" />
              Share
            </button>
            <a
              href={publicUrl ? `mailto:?subject=${encodeURIComponent(`${portfolio?.profile?.fullName || 'My'} portfolio`)}&body=${encodeURIComponent(publicUrl)}` : undefined}
              className="btn-secondary btn-sm"
              aria-disabled={!publicUrl}
            >
              <Mail size={13} aria-hidden="true" />
              Email
            </a>
            <Link to={`/dashboard/portfolio/${id}/analyze`} className="btn-secondary btn-sm">
              <Sparkles size={13} aria-hidden="true" />
              Run analyzer
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-canvasDeep/50 p-3">
            <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-line">
              <SmartImage src={portfolio.thumbnailUrl} alt="" ratio="aspect-[4/3]" fallbackSeed={portfolio.title?.length || 1} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{portfolio.title}</p>
              <p className="mt-0.5 text-[11px] text-faint">
                {template?.name} · {wordCount(portfolio.profile?.summary || '') + wordCount(portfolio.profile?.bio || '')} words of copy
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-faint">
                <Check size={9} className="text-success" aria-hidden="true" />
                Updated {formatRelative(portfolio.updatedAt)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-canvasDeep/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Quick links</p>
            <ul className="mt-2 space-y-1.5 text-xs">
              <li>
                <Link to={`/dashboard/portfolio/${id}/edit`} className="inline-flex items-center gap-1.5 text-inkSoft hover:text-white">
                  <Pencil size={11} aria-hidden="true" />
                  Edit content and design
                </Link>
              </li>
              <li>
                <Link to="/dashboard/blog" className="inline-flex items-center gap-1.5 text-inkSoft hover:text-white">
                  <Newspaper size={11} aria-hidden="true" />
                  Manage blog posts
                </Link>
              </li>
              <li>
                <Link to="/dashboard/templates" className="inline-flex items-center gap-1.5 text-inkSoft hover:text-white">
                  <Eye size={11} aria-hidden="true" />
                  Try a different template
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-inkSoft hover:text-white">
                  <LayoutDashboard size={11} aria-hidden="true" />
                  Back to dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Publish checklist</p>
            <span className="badge !py-0.5">{checklist.filter((item) => item.done).length}/{checklist.length} complete</span>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-start gap-2.5 py-2.5">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    item.done ? 'bg-success/20 text-success' : 'border border-lineStrong text-faint'
                  }`}
                >
                  {item.done ? <Check size={10} aria-hidden="true" /> : <span className="h-1 w-1 rounded-full bg-faint" aria-hidden="true" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${item.done ? 'text-inkSoft' : 'text-white'}`}>{item.label}</p>
                  <p className="mt-0.5 truncate text-[10px] text-faint">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-white">Next steps</p>
            <ol className="mt-2.5 space-y-2.5 text-xs leading-relaxed text-muted">
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[9px] font-semibold text-inkSoft">1</span>
                Add your own domain later — share the PortiAI link for now.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[9px] font-semibold text-inkSoft">2</span>
                Run the analyzer and apply the high-severity fixes.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[9px] font-semibold text-inkSoft">3</span>
                Publish a blog post so visitors see recent work.
              </li>
            </ol>
          </div>

          {portfolio.published ? (
            <div className="rounded-xl border border-line bg-surface/50 p-4">
              <p className="text-[11px] font-medium text-inkSoft">Need to take it down?</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">Unpublishing removes public access immediately and keeps your content intact.</p>
              <button type="button" onClick={unpublish} disabled={unpublishing} className="btn-ghost btn-sm mt-2 text-warning hover:bg-warningSoft">
                {unpublishing ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <Undo2 size={11} aria-hidden="true" />}
                Unpublish portfolio
              </button>
            </div>
          ) : (
            <Link to={`/dashboard/portfolio/${id}/edit`} className="card flex items-center justify-between p-4 transition-colors hover:border-accent-line">
              <div>
                <p className="text-sm font-semibold text-white">Ready to go live?</p>
                <p className="mt-0.5 text-[11px] text-muted">Open the editor and press Publish.</p>
              </div>
              <ArrowRight size={15} className="text-accent-hover" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
