import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, Loader2, Lock, RefreshCw } from 'lucide-react';
import PortfolioRenderer from '../templates/PortfolioRenderer.jsx';
import { portfolioService } from '../services/portfolioService.js';

const setMeta = (name, content) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export default function PublicPortfolio() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [blogEnabled, setBlogEnabled] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await portfolioService.getPublic(slug);
      setPortfolio(data.portfolio);
      setBlogEnabled(Boolean(data.portfolio.blog?.enabled));
      setStatus('ready');
    } catch (err) {
      setError(err.message || 'This portfolio could not be loaded.');
      setStatus(err.status === 404 ? 'missing' : 'error');
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!portfolio) return;
    const title = `${portfolio.profile?.fullName || portfolio.title}${portfolio.profile?.title ? ` — ${portfolio.profile.title}` : ''}`;
    document.title = `${title} | PortiAI`;
    const description =
      portfolio.profile?.summary ||
      portfolio.profile?.bio?.slice(0, 160) ||
      `${portfolio.profile?.fullName || 'A professional'} portfolio built with PortiAI.`;
    setMeta('description', description);
  }, [portfolio]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <Loader2 size={22} className="mx-auto animate-spin text-accent-hover" aria-hidden="true" />
          <p className="mt-3 text-xs text-muted">Loading portfolio…</p>
        </div>
      </div>
    );
  }

  if (status !== 'ready' || !portfolio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-canvasAlt text-muted">
          <Lock size={20} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-[18px] font-semibold text-ink">
          {status === 'missing' ? 'This portfolio is not available' : 'Something went wrong'}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {status === 'missing'
            ? 'The link may be incorrect, or the owner has unpublished this portfolio. Published portfolios are always reachable at their exact URL.'
            : error}
        </p>
        <div className="mt-5 flex gap-2">
          {status === 'error' ? (
            <button type="button" onClick={load} className="btn-secondary btn-sm">
              <RefreshCw size={13} aria-hidden="true" />
              Try again
            </button>
          ) : null}
          <Link to="/" className="btn-primary btn-sm">
            Build your own with PortiAI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PortfolioRenderer portfolio={portfolio} blogHref={blogEnabled ? `/p/${portfolio.slug}/blog` : undefined} />
      <div className="border-t border-line bg-canvasAlt px-4 py-4 text-center">
        <Link
          to="/?ref=portfolio-footer"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-faint transition-colors hover:text-ink"
        >
          Built with PortiAI
          <ArrowUpRight size={11} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
