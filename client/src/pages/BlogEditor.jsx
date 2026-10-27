import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Eye,
  ExternalLink,
  Globe2,
  Loader2,
  Pencil,
  Save,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Alert, Button, Field, Select, TextArea, TextInput } from '../components/ui/Primitives.jsx';
import { SmartImage } from '../components/ui/Kit.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Markdown, { estimateReadingTime } from '../utils/markdown.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { blogService } from '../services/blogService.js';
import { portfolioService, aiService } from '../services/portfolioService.js';
import useAiStatus from '../hooks/useAiStatus.js';
import { formatRelative } from '../utils/format.js';

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const COVER_SUGGESTIONS = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=70',
];

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { status: aiStatus } = useAiStatus();

  const [post, setPost] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tab, setTab] = useState('write');
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [aiBusy, setAiBusy] = useState(null);
  const [aiError, setAiError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blogService.get(id);
      setPost(data.post);
      setDirty(false);
      try {
        const portfolioData = await portfolioService.get(data.post.portfolioId);
        setPortfolio(portfolioData.portfolio);
      } catch {
        setPortfolio(null);
      }
    } catch (err) {
      if (err.status === 404) setNotFound(true);
      else setError(err.message || 'Could not load this post.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (patch) => {
    setPost((current) => ({ ...current, ...patch }));
    setDirty(true);
  };

  const save = async ({ quiet = false } = {}) => {
    if (!post) return false;
    if (!post.title.trim() || post.title.trim().length < 3) {
      toast.error('A post title of at least 3 characters is required.');
      return false;
    }
    setSaving(true);
    try {
      const data = await blogService.update(post.id, {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverUrl: post.coverUrl,
        tags: post.tags,
      });
      setPost(data.post);
      setLastSaved(new Date());
      setDirty(false);
      if (!quiet) toast.success('Post saved.');
      return true;
    } catch (err) {
      toast.error(err.message || 'Could not save the post.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    setPublishing(true);
    try {
      if (dirty) {
        const saved = await save({ quiet: true });
        if (!saved) throw new Error('Save the post before publishing.');
      }
      const data = await blogService.setPublished(post.id, !post.published);
      setPost(data.post);
      toast.success(data.post.published ? 'Post published to your portfolio blog.' : 'Post moved back to draft.');
      if (data.post.published) {
        const refreshed = await portfolioService.get(data.post.portfolioId);
        setPortfolio(refreshed.portfolio);
      }
    } catch (err) {
      toast.error(err.message || 'Could not change the publish state.');
    } finally {
      setPublishing(false);
    }
  };

  const runAi = async (kind) => {
    setAiError('');
    setAiBusy(kind);
    try {
      const text = kind === 'content' ? post.content : post.excerpt || post.content;
      if (!String(text || '').trim()) {
        throw new Error('Write a draft first — the AI improves existing text rather than inventing content.');
      }
      const data = await aiService.improve({
        kind: 'blog',
        text: String(text).slice(0, 2500),
        context: { role: post.title, technologies: post.tags, tone: 'professional' },
      });
      if (kind === 'content') update({ content: data.result.text });
      else update({ excerpt: data.result.text.slice(0, 320) });
      toast.success('AI suggestion applied.', { description: data.result.notes || 'Review the wording before publishing.' });
    } catch (err) {
      setAiError(err.message || 'AI writing help is unavailable right now.');
    } finally {
      setAiBusy(null);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await blogService.remove(post.id);
      toast.success('Post deleted.');
      navigate('/dashboard/blog');
    } catch (err) {
      toast.error(err.message || 'Could not delete the post.');
    } finally {
      setDeleting(false);
    }
  };

  const publicHref = useMemo(() => {
    if (!portfolio?.slug) return '';
    return `/p/${portfolio.slug}/blog/${post?.slug || ''}`;
  }, [portfolio, post]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={20} className="animate-spin text-accent-hover" aria-hidden="true" />
        <span className="sr-only">Loading post</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-[18px] font-semibold text-ink">Post not found</h1>
        <p className="mt-2 text-sm text-muted">This post does not exist, or it belongs to another account.</p>
        <Link to="/dashboard/blog" className="btn-primary mt-5">
          Back to blog studio
        </Link>
      </div>
    );
  }

  if (error || !post) {
    return <Alert tone="error" title="Could not load this post" actions={<Button size="sm" variant="secondary" onClick={load}>Try again</Button>}>{error}</Alert>;
  }

  const words = (post.content.match(/[A-Za-z0-9'’-]+/g) || []).length;

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/dashboard/blog" className="btn-ghost h-8 w-8 shrink-0 p-0" aria-label="Back to blog studio">
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Edit post</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-faint">
              <span className={post.published ? 'badge-published !py-0' : 'badge-draft !py-0'}>{post.published ? 'Published' : 'Draft'}</span>
              <span>{portfolio?.title || 'Portfolio'}</span>
              <span aria-hidden="true">·</span>
              <span>{words} words</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={10} aria-hidden="true" />
                {estimateReadingTime(post.content)} min read
              </span>
              {dirty ? (
                <span className="text-warning">• Unsaved changes</span>
              ) : lastSaved ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <Check size={10} aria-hidden="true" />
                  Saved {formatRelative(lastSaved)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => save()} loading={saving} disabled={!dirty}>
            <Save size={13} aria-hidden="true" />
            Save
          </Button>
          {post.published ? (
            <>
              {portfolio?.published && publicHref ? (
                <a href={publicHref} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                  <ExternalLink size={13} aria-hidden="true" />
                  View
                </a>
              ) : null}
              <Button variant="ghost" size="sm" onClick={togglePublish} loading={publishing}>
                Unpublish
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={togglePublish} loading={publishing}>
              <Send size={13} aria-hidden="true" />
              Publish
            </Button>
          )}
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="btn-ghost btn-sm h-8 w-8 p-0 text-danger hover:bg-dangerSoft hover:text-danger"
            aria-label="Delete post"
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {post.published && portfolio && !portfolio.published ? (
        <Alert tone="warning" title="This post is published, but its portfolio is not">
          The post stays invisible publicly until the portfolio itself is published. Open the portfolio editor and press
          Publish.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.85fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas p-0.5" role="tablist" aria-label="Editor mode">
              {[
                { id: 'write', label: 'Write', icon: Pencil },
                { id: 'preview', label: 'Preview', icon: Eye },
              ].map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  type="button"
                  role="tab"
                  aria-selected={tab === tabId}
                  onClick={() => setTab(tabId)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium ${
                    tab === tabId ? 'bg-canvasAlt text-ink' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={11} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => runAi('content')}
              disabled={Boolean(aiBusy)}
              className="btn-ghost btn-sm"
              title={aiStatus?.configured ? 'Improve the content with AI' : 'AI is not configured on this server'}
            >
              {aiBusy === 'content' ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <Wand2 size={12} aria-hidden="true" />}
              Improve with AI
            </button>
          </div>

          <div className="p-4">
            {tab === 'write' ? (
              <div className="space-y-3">
                <TextArea
                  value={post.content}
                  onChange={(event) => update({ content: event.target.value })}
                  rows={22}
                  maxLength={20000}
                  placeholder={`## What I built\n\nWrite in Markdown. **Bold**, *italic*, \`code\`, [links](https://example.com), lists and quotes are supported.\n\n- Point one\n- Point two`}
                  className="min-h-[420px] font-mono text-[13px] leading-6"
                  aria-label="Post content in Markdown"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-faint">
                  <span>Markdown supported · HTML is stripped for safety</span>
                  <span>{post.content.length}/20000 characters</span>
                </div>
              </div>
            ) : (
              <article className="min-h-[420px]">
                {post.coverUrl ? <SmartImage src={post.coverUrl} alt="" ratio="aspect-[16/7]" className="mb-5 rounded-lg" fallbackSeed={2} /> : null}
                <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">{post.title || 'Untitled post'}</h1>
                {post.excerpt ? <p className="mt-2 text-sm italic text-muted">{post.excerpt}</p> : null}
                <div className="mt-5">
                  <Markdown content={post.content || '_Nothing written yet._'} />
                </div>
              </article>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-sm font-semibold text-ink">Post details</p>
            <div className="mt-4 space-y-4">
              <Field label="Title" htmlFor="post-title" required>
                <TextInput
                  id="post-title"
                  value={post.title}
                  maxLength={160}
                  onChange={(event) => {
                    const title = event.target.value;
                    const shouldUpdateSlug = !post.slug || post.slug === slugify(post.title);
                    update({ title, ...(shouldUpdateSlug ? { slug: slugify(title) } : {}) });
                  }}
                />
              </Field>
              <Field label="URL slug" htmlFor="post-slug" hint={portfolio?.slug ? `/p/${portfolio.slug}/blog/${post.slug}` : 'Set when the portfolio has a slug.'}>
                <TextInput
                  id="post-slug"
                  value={post.slug}
                  maxLength={90}
                  onChange={(event) => update({ slug: slugify(event.target.value) })}
                />
              </Field>
              <Field label="Excerpt" htmlFor="post-excerpt" hint="Shown on the blog listing and in search results.">
                <TextArea
                  id="post-excerpt"
                  rows={3}
                  value={post.excerpt}
                  maxLength={320}
                  onChange={(event) => update({ excerpt: event.target.value })}
                />
              </Field>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-faint">{post.excerpt.length}/320</p>
                <button
                  type="button"
                  onClick={() => runAi('excerpt')}
                  disabled={Boolean(aiBusy)}
                  className="btn-ghost btn-sm"
                >
                  {aiBusy === 'excerpt' ? <Loader2 size={11} className="animate-spin" aria-hidden="true" /> : <Sparkles size={11} aria-hidden="true" />}
                  AI excerpt
                </button>
              </div>
              <Field label="Cover image URL" htmlFor="post-cover" hint="Optional. Use a direct image link.">
                <TextInput
                  id="post-cover"
                  value={post.coverUrl}
                  maxLength={2048}
                  placeholder="https://images.unsplash.com/…"
                  onChange={(event) => update({ coverUrl: event.target.value })}
                />
              </Field>
              <div>
                <p className="label">Suggested covers</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {COVER_SUGGESTIONS.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => update({ coverUrl: url })}
                      className={`overflow-hidden rounded-md border ${post.coverUrl === url ? 'border-accent-hover ring-1 ring-accent-hover' : 'border-line hover:border-lineStrong'}`}
                      aria-label={`Use suggested cover ${index + 1}`}
                    >
                      <SmartImage src={url} alt="" ratio="aspect-[4/3]" fallbackSeed={index} />
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Tags" htmlFor="post-tags" hint="Comma separated, up to 8.">
                <TextInput
                  id="post-tags"
                  value={(post.tags || []).join(', ')}
                  onChange={(event) =>
                    update({
                      tags: event.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .slice(0, 8),
                    })
                  }
                />
              </Field>
              <Field label="Portfolio" htmlFor="post-portfolio" hint="Posts are attached to one portfolio and cannot be moved after creation.">
                <Select id="post-portfolio" value={post.portfolioId} disabled>
                  <option value={post.portfolioId}>{portfolio?.title || 'Linked portfolio'}</option>
                </Select>
              </Field>
            </div>
          </div>

          {aiError ? (
            <Alert tone="warning" title="AI writing help unavailable">{aiError}</Alert>
          ) : (
            <div className="rounded-lg border border-line bg-surface p-4 text-[11px] leading-relaxed text-muted">
              <p className="font-medium text-inkSoft">AI writing help</p>
              <p className="mt-1.5">
                {aiStatus?.configured
                  ? 'Improving rewrites only the text you have written — it will not add new claims. Review the result before publishing.'
                  : 'AI is not configured on this server. All writing and publishing features still work without it.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
        busy={deleting}
        title="Delete this post?"
        description="This permanently removes the post and its public URL. This cannot be undone."
        confirmLabel="Delete post"
      />

      {post.published && portfolio?.published && publicHref ? (
        <p className="flex items-center gap-2 rounded-lg border border-successLine bg-successSoft px-3.5 py-2.5 text-[11px] text-success">
          <Globe2 size={12} aria-hidden="true" />
          Live at {portfolio.slug && `${window.location.origin}${publicHref}`}
          {dirty ? <span className="ml-auto inline-flex items-center gap-1 text-warning"><AlertCircle size={11} aria-hidden="true" />Unsaved edits are not live yet</span> : null}
        </p>
      ) : null}
    </div>
  );
}
