import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Copy,
  Eye,
  ExternalLink,
  FileText,
  Globe2,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';
import { PageHeader, SmartImage } from '../components/ui/Kit.jsx';
import { Button, EmptyState, Field, Select, TextInput } from '../components/ui/Primitives.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Markdown, { estimateReadingTime } from '../utils/markdown.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { blogService } from '../services/blogService.js';
import { portfolioService } from '../services/portfolioService.js';
import { formatDate, formatRelative } from '../utils/format.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';

const COVERS = [
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=70',
];

export default function BlogStudio() {
  const navigate = useNavigate();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = useState('all');
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', portfolioId: '', excerpt: '' });
  const [createError, setCreateError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [postData, portfolioData] = await Promise.all([
        blogService.list({ search: debounced, status }),
        portfolioService.list({ sort: 'updated' }),
      ]);
      setPosts(postData.posts || []);
      setPortfolios(portfolioData.portfolios || []);
      setNewPost((current) => ({ ...current, portfolioId: current.portfolioId || portfolioData.portfolios?.[0]?.id || '' }));
    } catch (err) {
      setError(err.message || 'Could not load your blog posts.');
    } finally {
      setLoading(false);
    }
  }, [debounced, status]);

  useEffect(() => {
    load();
  }, [load]);

  const portfolioMap = useMemo(() => Object.fromEntries(portfolios.map((portfolio) => [portfolio.id, portfolio])), [portfolios]);

  const createPost = async (event) => {
    event.preventDefault();
    setCreateError('');
    if (!newPost.title.trim() || newPost.title.trim().length < 3) {
      setCreateError('Give the post a title of at least 3 characters.');
      return;
    }
    if (!newPost.portfolioId) {
      setCreateError('Choose which portfolio this post belongs to.');
      return;
    }
    setCreating(true);
    try {
      const data = await blogService.create({
        portfolioId: newPost.portfolioId,
        title: newPost.title.trim(),
        excerpt: newPost.excerpt.trim(),
        coverUrl: COVERS[Math.floor(Math.random() * COVERS.length)],
      });
      toast.success('Post draft created.');
      setCreateOpen(false);
      setNewPost({ title: '', portfolioId: portfolios[0]?.id || '', excerpt: '' });
      navigate(`/dashboard/blog/${data.post.id}`);
    } catch (err) {
      setCreateError(err.message || 'Could not create the post.');
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (post) => {
    setBusyId(post.id);
    try {
      const data = await blogService.setPublished(post.id, !post.published);
      setPosts((current) => current.map((item) => (item.id === post.id ? data.post : item)));
      toast.success(data.post.published ? 'Post published.' : 'Post moved back to draft.');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not change the post status.');
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async (post) => {
    const portfolio = portfolioMap[post.portfolioId];
    if (!post.published || !portfolio?.slug) {
      toast.info('Publish the post (and its portfolio) before sharing the link.');
      return;
    }
    const url = `${window.location.origin}/p/${portfolio.slug}/blog/${post.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Post link copied.');
    } catch {
      toast.info('Copy this link manually:', { description: url, duration: 9000 });
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await blogService.remove(deleteTarget.id);
      toast.success('Post deleted.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not delete the post.');
    } finally {
      setDeleting(false);
    }
  };

  const emptySearch = Boolean(debounced) || status !== 'all';

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Blog studio"
        title="Write, publish and attach a blog to your portfolio"
        description="Markdown posts with optional AI writing help. Drafts stay private; published posts appear on your portfolio’s blog page."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!portfolios.length}>
            <Plus size={14} aria-hidden="true" />
            New post
          </Button>
        }
      />

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search posts…"
            aria-label="Search blog posts"
            className="input h-9 py-1.5 pl-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-canvasDeep p-0.5" role="group" aria-label="Post status">
          {[
            { id: 'all', label: 'All' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              aria-pressed={status === filter.id}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                status === filter.id ? 'bg-white/[0.09] text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <p className="ml-auto text-[11px] text-faint">
          {posts.length} post{posts.length === 1 ? '' : 's'} · {posts.filter((post) => post.published).length} published
        </p>
      </div>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-dangerSoft p-4 text-sm text-danger">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="card flex gap-3 p-3">
              <div className="skeleton h-20 w-28 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : !portfolios.length ? (
        <EmptyState
          icon={Newspaper}
          title="Create a portfolio first"
          description="Blog posts belong to a portfolio, so that they can appear on its public blog page. Build a portfolio, then come back here."
          action={
            <Link to="/dashboard/builder" className="btn-primary btn-sm">
              <Plus size={13} aria-hidden="true" />
              Create a portfolio
            </Link>
          }
        />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={emptySearch ? 'No posts match those filters' : 'No blog posts yet'}
          description={
            emptySearch
              ? 'Try a different search term or reset the filters.'
              : 'Write about a project, a decision you made, or something you learned. Short, specific posts work best.'
          }
          action={
            emptySearch ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                }}
              >
                <Undo2 size={14} aria-hidden="true" />
                Reset filters
              </Button>
            ) : (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={14} aria-hidden="true" />
                Write your first post
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {posts.map((post) => {
            const portfolio = portfolioMap[post.portfolioId];
            return (
              <article key={post.id} className="card flex flex-col overflow-hidden transition-all hover:border-lineStrong sm:flex-row">
                <div className="sm:w-40 sm:shrink-0">
                  <SmartImage src={post.coverUrl} alt="" ratio="aspect-[16/10] sm:h-full sm:aspect-auto" className="h-36 w-full sm:h-full" fallbackSeed={post.title.length} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/dashboard/blog/${post.id}`} className="line-clamp-2 text-sm font-semibold text-white hover:text-accent-hover">
                        {post.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{post.excerpt || 'No excerpt yet.'}</p>
                    </div>
                    <span className={post.published ? 'badge-published shrink-0' : 'badge-draft shrink-0'}>{post.published ? 'Live' : 'Draft'}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-faint">
                    <span className="truncate">{portfolio?.title || 'Portfolio'}</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={10} aria-hidden="true" />
                      {formatRelative(post.updatedAt)}
                    </span>
                    <span>{estimateReadingTime(post.content)} min read</span>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-line pt-2.5">
                    <Link to={`/dashboard/blog/${post.id}`} className="btn-secondary btn-sm">
                      <Pencil size={12} aria-hidden="true" />
                      Edit
                    </Link>
                    <button type="button" onClick={() => setPreview(post)} className="btn-ghost btn-sm h-8 w-8 p-0" aria-label={`Preview ${post.title}`} title="Preview">
                      <Eye size={13} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => togglePublish(post)} disabled={busyId === post.id} className="btn-ghost btn-sm" title={post.published ? 'Unpublish' : 'Publish'}>
                      {busyId === post.id ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : post.published ? <Globe2 size={12} aria-hidden="true" /> : <Send size={12} aria-hidden="true" />}
                      <span className="hidden sm:inline">{post.published ? 'Unpublish' : 'Publish'}</span>
                    </button>
                    {post.published ? (
                      <>
                        <button type="button" onClick={() => copyLink(post)} className="btn-ghost btn-sm h-8 w-8 p-0" aria-label="Copy public link" title="Copy link">
                          <Copy size={12} aria-hidden="true" />
                        </button>
                        {portfolio?.published && portfolio.slug ? (
                          <a
                            href={`/p/${portfolio.slug}/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost btn-sm h-8 w-8 p-0"
                            aria-label="Open public post"
                            title="Open public post"
                          >
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        ) : null}
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(post)}
                      className="btn-ghost btn-sm ml-auto h-8 w-8 p-0 text-danger/80 hover:bg-danger/10 hover:text-danger"
                      aria-label={`Delete ${post.title}`}
                      title="Delete"
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create post */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New blog post"
        description="Drafts are private until you publish them. You can change the title and content after creating it."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createPost} loading={creating} disabled={creating}>
              Create draft
            </Button>
          </>
        }
      >
        <form onSubmit={createPost} className="space-y-4">
          {createError ? (
            <p role="alert" className="rounded-lg border border-danger/30 bg-dangerSoft px-3 py-2 text-xs text-danger">
              {createError}
            </p>
          ) : null}
          <Field label="Title" htmlFor="new-title" required>
            <TextInput
              id="new-title"
              value={newPost.title}
              maxLength={160}
              placeholder="How I built my campus events portal"
              onChange={(event) => setNewPost((current) => ({ ...current, title: event.target.value }))}
            />
          </Field>
          <Field label="Portfolio" htmlFor="new-portfolio" required hint="Published posts appear on this portfolio's blog page.">
            <Select
              id="new-portfolio"
              value={newPost.portfolioId}
              onChange={(event) => setNewPost((current) => ({ ...current, portfolioId: event.target.value }))}
            >
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Excerpt" htmlFor="new-excerpt" hint="Optional one-line summary shown on the blog listing.">
            <TextInput
              id="new-excerpt"
              value={newPost.excerpt}
              maxLength={320}
              placeholder="What the post is about, in one sentence."
              onChange={(event) => setNewPost((current) => ({ ...current, excerpt: event.target.value }))}
            />
          </Field>
        </form>
      </Modal>

      {/* Preview */}
      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.title || 'Post preview'}
        description={preview ? `${preview.published ? 'Published' : 'Draft'} · updated ${formatDate(preview.updatedAt)}` : ''}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Close
            </Button>
            {preview ? (
              <Link to={`/dashboard/blog/${preview.id}`} className="btn-primary" onClick={() => setPreview(null)}>
                <Pencil size={14} aria-hidden="true" />
                Edit post
              </Link>
            ) : null}
          </>
        }
      >
        {preview ? (
          <div>
            {preview.coverUrl ? <SmartImage src={preview.coverUrl} alt="" ratio="aspect-[16/7]" className="mb-4 rounded-xl" fallbackSeed={3} /> : null}
            {preview.excerpt ? <p className="mb-4 border-l-2 border-accent-line pl-3 text-sm italic text-muted">{preview.excerpt}</p> : null}
            <Markdown content={preview.content || '_This post has no content yet._'} />
          </div>
        ) : null}
      </Modal>

      {deleteTarget ? (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={remove}
          busy={deleting}
          title={`Delete “${deleteTarget.title}”?`}
          description="This post will be permanently deleted. If it was published, its public link will stop working immediately."
          confirmLabel="Delete post"
        />
      ) : null}
    </div>
  );
}
