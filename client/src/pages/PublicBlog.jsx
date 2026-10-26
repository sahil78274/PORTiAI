import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Calendar, Clock, Loader2, Lock, RefreshCw, Search } from 'lucide-react';
import Markdown, { estimateReadingTime } from '../utils/markdown.jsx';
import { publicBlogService } from '../services/blogService.js';
import { portfolioService } from '../services/portfolioService.js';
import { formatDate } from '../utils/format.js';

const usePortfolioTheme = (portfolio) => {
  const accent = portfolio?.theme?.accent || '#6366f1';
  return useMemo(
    () => ({
      accent,
      style: { '--blog-accent': accent },
    }),
    [accent]
  );
};

function Shell({ portfolio, children, slug }) {
  const { style } = usePortfolioTheme(portfolio);
  return (
    <div className="min-h-screen bg-[#f8f8f6] text-[#14161c]" style={style}>
      <header className="border-b border-black/[0.08] bg-[#f8f8f6]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link to={`/p/${slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60 transition-colors hover:text-black">
            <ArrowLeft size={13} aria-hidden="true" />
            {portfolio?.profile?.fullName || 'Portfolio'}
          </Link>
          <Link to={`/p/${slug}#contact`} className="text-xs font-medium text-black/60 transition-colors hover:text-black">
            Contact
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">{children}</main>
      <footer className="border-t border-black/[0.08] px-5 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 text-[11px] text-black/45 sm:flex-row">
          <span>
            {portfolio?.profile?.fullName || 'Portfolio'} · {new Date().getFullYear()}
          </span>
          <Link to="/?ref=blog-footer" className="inline-flex items-center gap-1 hover:text-black/70">
            Built with PortiAI
            <ArrowUpRight size={10} aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Notice({ title, body, slug, retry }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-black/50">
        <Lock size={18} aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-lg font-semibold">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-black/55">{body}</p>
      <div className="mt-5 flex gap-2">
        {retry ? (
          <button type="button" onClick={retry} className="rounded-lg border border-black/15 px-3 py-2 text-xs font-medium hover:bg-white">
            <RefreshCw size={12} className="mr-1 inline" aria-hidden="true" />
            Try again
          </button>
        ) : null}
        {slug ? (
          <Link to={`/p/${slug}`} className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-black/85">
            Back to portfolio
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function PublicBlogList() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [portfolioData, blogData] = await Promise.all([
        portfolioService.getPublic(slug),
        publicBlogService.list(slug),
      ]);
      setPortfolio(portfolioData.portfolio);
      setPosts(blogData.posts || []);
      setStatus('ready');
      document.title = `${portfolioData.portfolio.blog?.title || 'Blog'} | ${portfolioData.portfolio.profile?.fullName || 'Portfolio'}`;
    } catch {
      setStatus('missing');
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter((post) => `${post.title} ${post.excerpt}`.toLowerCase().includes(term));
  }, [posts, search]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
        <Loader2 size={20} className="animate-spin text-black/40" aria-hidden="true" />
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <Notice
        title="This blog is not available"
        body="The blog may be disabled, or the portfolio has not been published yet."
        slug={slug}
        retry={load}
      />
    );
  }

  const meta = portfolio.blog || {};

  return (
    <Shell portfolio={portfolio} slug={slug}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--blog-accent)]">Writing</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{meta.title || 'Notes & writing'}</h1>
      {meta.intro ? <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/60">{meta.intro}</p> : null}

      {posts.length > 4 ? (
        <div className="relative mt-6 max-w-sm">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search posts…"
            aria-label="Search posts"
            className="w-full rounded-lg border border-black/12 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-black/30"
          />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-12 rounded-xl border border-dashed border-black/12 px-5 py-10 text-center text-sm text-black/45">
          {posts.length === 0 ? 'No posts have been published yet.' : 'No posts match that search.'}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-black/[0.08] border-t border-black/[0.08]">
          {filtered.map((post) => (
            <li key={post.id}>
              <Link to={`/p/${slug}/blog/${post.slug}`} className="group flex flex-col gap-3 py-6 sm:flex-row sm:items-start sm:gap-5">
                {post.coverUrl ? (
                  <img
                    src={post.coverUrl}
                    alt=""
                    loading="lazy"
                    className="h-32 w-full shrink-0 rounded-lg object-cover sm:h-24 sm:w-36"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-[color:var(--blog-accent)]">
                    {post.title}
                  </h2>
                  {post.excerpt ? <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-black/55">{post.excerpt}</p> : null}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-black/40">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={10} aria-hidden="true" />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={10} aria-hidden="true" />
                      {estimateReadingTime(post.content)} min read
                    </span>
                    {post.tags?.length ? <span>{post.tags.slice(0, 3).join(' · ')}</span> : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

export function PublicBlogPost() {
  const { slug, postSlug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [portfolioData, postData] = await Promise.all([
        portfolioService.getPublic(slug),
        publicBlogService.post(slug, postSlug),
      ]);
      setPortfolio(portfolioData.portfolio);
      setPost(postData.post);
      setStatus('ready');
      document.title = `${postData.post.title} | ${portfolioData.portfolio.profile?.fullName || 'Portfolio'}`;
    } catch {
      setStatus('missing');
    }
  }, [slug, postSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [postSlug]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f6]">
        <Loader2 size={20} className="animate-spin text-black/40" aria-hidden="true" />
      </div>
    );
  }

  if (status === 'missing' || !post) {
    return <Notice title="Post not found" body="This post may have been unpublished or removed." slug={slug} retry={load} />;
  }

  return (
    <Shell portfolio={portfolio} slug={slug}>
      <Link to={`/p/${slug}/blog`} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-black/50 hover:text-black">
        <ArrowLeft size={12} aria-hidden="true" />
        All posts
      </Link>
      <article className="mt-5">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-black/45">
          <span>{portfolio?.profile?.fullName}</span>
          <span className="inline-flex items-center gap-1">
            <Calendar size={10} aria-hidden="true" />
            {formatDate(post.publishedAt || post.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={10} aria-hidden="true" />
            {estimateReadingTime(post.content)} min read
          </span>
        </div>
        {post.coverUrl ? (
          <img
            src={post.coverUrl}
            alt=""
            className="mt-6 aspect-[16/8] w-full rounded-xl object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        {post.excerpt ? (
          <p className="mt-6 border-l-2 pl-4 text-base italic leading-relaxed text-black/60" style={{ borderColor: 'var(--blog-accent)' }}>
            {post.excerpt}
          </p>
        ) : null}
        <div className="prose-blog mt-7">
          <Markdown content={post.content} />
        </div>
        {post.tags?.length ? (
          <ul className="mt-8 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-black/12 px-2.5 py-0.5 text-[10px] font-medium text-black/55">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </Shell>
  );
}
