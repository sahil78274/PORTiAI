import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Copy, Check, FileQuestion, ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';
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
        <div className="flex items-center gap-2.5 text-xs text-muted">
          <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
          <span>Loading public portfolio…</span>
        </div>
      </div>
    );
  }

  if (state === 'missing' || state === 'error') {
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <header className="border-b border-line bg-surface">
          <div className="container-page flex h-14 items-center justify-between">
            <Logo />
            <Link to="/" className="text-xs font-semibold text-slate-600 hover:text-ink transition-colors">
              Home
            </Link>
          </div>
        </header>
        <main className="flex flex-1 items-center">
          <div className="container-page max-w-lg py-16">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface text-slate-400 shadow-2xs">
              <FileQuestion size={22} aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
              {state === 'missing' ? 'Portfolio not available' : 'Failed to load portfolio'}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {state === 'missing'
                ? 'The link may be mistyped, or the creator has unpublished this portfolio. Only published portfolios are accessible on the public web.'
                : error}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/" className="btn-primary btn-sm">
                <ArrowLeft size={14} aria-hidden="true" />
                <span>Back to PortiAI</span>
              </Link>
              {state === 'error' ? (
                <button type="button" onClick={load} className="btn-secondary btn-sm">
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
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:shadow-raised"
      >
        Skip to portfolio
      </a>

      {/* Top Banner */}
      <div className="border-b border-line bg-slate-50/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-2 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-2xs text-muted">
              Public Portfolio · <strong className="font-semibold text-slate-700">{getTemplate(portfolio.templateId).name}</strong> · Updated {formatDate(portfolio.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copy} className="btn-secondary btn-sm !py-1 text-2xs font-semibold">
              {copied ? <Check size={12} className="text-emerald-600" aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
              <span>{copied ? 'Link copied' : 'Share link'}</span>
            </button>
          </div>
        </div>
      </div>

      <main id="portfolio-content">
        <PortfolioRenderer portfolio={portfolio} />
      </main>

      <footer className="border-t border-line bg-slate-50">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-6">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="text-2xs text-muted">· Live verified student portfolio</span>
          </div>
          <Link to="/register" className="btn-secondary btn-sm text-xs font-semibold">
            <Sparkles size={13} aria-hidden="true" />
            <span>Build your own with PortiAI</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
