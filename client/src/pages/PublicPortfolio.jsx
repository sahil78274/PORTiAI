import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Check, FileQuestion, ArrowLeft, Sparkles } from 'lucide-react';
import PortfolioRenderer from '../templates/PortfolioRenderer.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { formatDate } from '../utils/format.js';
import { getTemplate } from '../utils/templates.js';
import Logo from '../components/ui/Logo.jsx';

export default function PublicPortfolio() {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const data = await portfolioService.getPublic(slug);
      setPortfolio(data.portfolio);
      setState('ready');
    } catch (err) {
      setError(err.message || 'This portfolio could not be loaded.');
      setState(err.status === 404 ? 'missing' : 'error');
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (portfolio?.profile?.fullName) {
      const template = getTemplate(portfolio.templateId);
      document.title = `${portfolio.profile.fullName}${portfolio.profile.title ? ` — ${portfolio.profile.title}` : ''}`;
      return () => {
        document.title = `${template.name} · PortiAI`;
      };
    }
    return undefined;
  }, [portfolio]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-muted" role="status">
          Loading portfolio…
        </p>
      </div>
    );
  }

  if (state === 'missing' || state === 'error') {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <header className="border-b border-line">
          <div className="container-page flex h-14 items-center justify-between">
            <Logo />
            <Link to="/" className="text-sm text-inkSoft hover:text-ink">
              Home
            </Link>
          </div>
        </header>
        <main className="flex flex-1 items-center">
          <div className="container-page max-w-lg py-16">
            <span className="flex h-10 w-10 items-center justify-center rounded border border-line bg-surface text-muted">
              <FileQuestion size={18} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl">
              {state === 'missing' ? 'This portfolio is not available' : 'Something went wrong'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-inkSoft">
              {state === 'missing'
                ? 'The link may be mistyped, or the owner may have unpublished or deleted the portfolio. Only published portfolios are publicly visible.'
                : error}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/" className="btn-primary">
                <ArrowLeft size={15} aria-hidden="true" /> Back to PortiAI
              </Link>
              {state === 'error' ? (
                <button type="button" onClick={load} className="btn-secondary">
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#portfolio-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-raised"
      >
        Skip to portfolio
      </a>

      <div className="border-b border-line bg-canvas">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-2 px-4 py-2">
          <p className="text-xs text-muted">
            Public portfolio · {getTemplate(portfolio.templateId).name} · last updated {formatDate(portfolio.updatedAt)}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copy} className="btn-secondary px-2 py-1 text-xs">
              {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>

      <main id="portfolio-content">
        <PortfolioRenderer portfolio={portfolio} />
      </main>

      <footer className="border-t border-line bg-canvasAlt">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-xs text-muted">— published portfolio</span>
          </div>
          <Link to="/register" className="btn-secondary px-3 py-1.5 text-xs">
            <Sparkles size={13} aria-hidden="true" /> Build your own portfolio
          </Link>
        </div>
      </footer>
    </div>
  );
}
