import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Gauge,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  Wand2,
  Pencil,
  Copy,
  ExternalLink,
  ListChecks,
} from 'lucide-react';
import { Alert, Button, ProgressBar, ScoreRing, Spinner } from '../components/ui/Primitives.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import useAiStatus from '../hooks/useAiStatus.js';
import { formatRelative } from '../utils/format.js';
import { draftToPayload, draftFromPortfolio } from '../utils/portfolioDraft.js';

const SEVERITY_TONE = {
  high: { label: 'High', className: 'bg-danger', text: 'text-danger' },
  medium: { label: 'Medium', className: 'bg-warning', text: 'text-warning' },
  low: { label: 'Low', className: 'bg-lineStrong', text: 'text-muted' },
};

const PRIORITY_LABEL = { now: 'Fix first', next: 'Next', later: 'Later' };

const SECTION_NAMES = {
  profile: 'Profile',
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  achievements: 'Achievements',
  contact: 'Contact',
  general: 'Writing',
};

export default function Analyze() {
  const { id } = useParams();
  const toast = useToast();

  const [portfolio, setPortfolio] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { status: aiStatus, setStatus: setAiStatus, reload: reloadAiStatus } = useAiStatus();
  const [applying, setApplying] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await portfolioService.get(id);
      setPortfolio(data.portfolio);
      setAnalysis(data.portfolio.analysis || null);
      reloadAiStatus();
    } catch (err) {
      setError(err.status === 404 ? 'This portfolio does not exist or belongs to another account.' : err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAnalysis = async ({ force = false, useAi = true } = {}) => {
    setRunning(true);
    setError('');
    setNotice('');
    try {
      const data = await portfolioService.analyze(id, { force, useAi });
      setAnalysis(data.analysis);
      setNotice(
        data.notice ||
          (data.cached
            ? 'Showing the stored analysis for the current content. Re-run after editing to refresh it.'
            : data.aiUsed
              ? 'Rule-based scores with additional AI observations.'
              : 'Rule-based analysis only — AI feedback was not used for this run.')
      );
      if (data.usage) setAiStatus((current) => ({ ...(current || {}), usage: data.usage }));
      const refreshed = await portfolioService.get(id);
      setPortfolio(refreshed.portfolio);
      toast.success('Analysis complete.');
    } catch (err) {
      setError(err.message || 'The analysis could not be completed.');
    } finally {
      setRunning(false);
    }
  };

  const applyExample = async (example) => {
    if (!example.target) {
      toast.info('This suggestion is a pattern to follow rather than a direct replacement.', {
        description: 'Copy the structure and fill the bracketed parts with your own facts.',
      });
      return;
    }
    setApplying(example.label);
    try {
      const data = await portfolioService.get(id);
      const draft = draftFromPortfolio(data.portfolio);
      const next = { ...draft };

      if (example.target.kind === 'bio') {
        next.profile = { ...next.profile, bio: example.after };
      } else if (example.target.kind === 'project') {
        next.projects = next.projects.map((project) =>
          project.name === example.target.name ? { ...project, description: example.after } : project
        );
      }

      await portfolioService.update(id, draftToPayload(next));
      toast.success('Suggestion applied to your portfolio.', {
        description: 'Replace the bracketed placeholders with your own facts, then re-run the analysis.',
      });
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not apply this suggestion.');
    } finally {
      setApplying(null);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard.');
    } catch {
      toast.info('Could not copy automatically. Select the text and copy manually.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading analysis…" />
      </div>
    );
  }

  if (error && !analysis && !portfolio) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="text-xl">Analysis unavailable</h1>
        <p className="mt-2 text-sm text-inkSoft">{error}</p>
        <Link to="/dashboard" className="btn-primary mt-4">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const stale = analysis && portfolio?.updatedAt && analysis.generatedAt
    ? new Date(portfolio.updatedAt) > new Date(analysis.generatedAt)
    : false;

  const highIssues = (analysis?.issues || []).filter((issue) => issue.severity === 'high');
  const otherIssues = (analysis?.issues || []).filter((issue) => issue.severity !== 'high');

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
            <ArrowLeft size={12} aria-hidden="true" /> Back to portfolios
          </Link>
          <h1 className="mt-1 text-2xl">Portfolio analysis</h1>
          <p className="mt-1 text-sm text-muted">
            {portfolio?.title} · content quality review against a documented rubric
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/portfolio/${id}/edit`} className="btn-secondary">
            <Pencil size={14} aria-hidden="true" /> Open editor
          </Link>
          <Button onClick={() => runAnalysis({ force: true })} loading={running} disabled={running}>
            <RefreshCw size={14} aria-hidden="true" /> {analysis ? 'Re-run analysis' : 'Run analysis'}
          </Button>
        </div>
      </div>

      {aiStatus ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-line bg-surface px-3 py-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} aria-hidden="true" />
            {aiStatus.configured ? 'Gemini is configured for AI feedback.' : 'Gemini is not configured — rule-based results only.'}
          </span>
          {aiStatus.usage ? (
            <span>
              AI requests today: {aiStatus.usage.used}/{aiStatus.usage.limit}
            </span>
          ) : null}
        </div>
      ) : null}

      {notice ? (
        <Alert tone="info" className="mt-3">
          {notice}
        </Alert>
      ) : null}

      {stale ? (
        <Alert tone="warning" className="mt-3" title="This analysis is out of date">
          The portfolio was edited after this analysis was stored. Re-run the analysis to score the current content.
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="error" className="mt-3" title="Analysis problem">
          {error}
        </Alert>
      ) : null}

      {!analysis ? (
        <div className="card mt-5 p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded border border-accent-line bg-accent-soft text-accent">
            <Gauge size={18} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-lg">No analysis stored yet</h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-inkSoft">
            The analyzer scores seven categories — completeness, summary clarity, project quality, skills, education and
            experience, links and readability — then lists issues and prioritised fixes. Deterministic checks always run;
            AI observations are added when the Gemini API is available.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => runAnalysis({ force: true })} loading={running}>
              <Gauge size={14} aria-hidden="true" /> Run analysis
            </Button>
            <Button variant="secondary" onClick={() => runAnalysis({ force: true, useAi: false })} loading={running}>
              Run rule-based only
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="card flex flex-col items-center gap-3 p-5">
              <ScoreRing score={analysis.score} size={148} />
              <div className="text-center">
                <p className="text-lg font-semibold text-ink">{analysis.grade}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Analysed {analysis.generatedAt ? formatRelative(analysis.generatedAt) : 'recently'}
                </p>
              </div>
              <span className={analysis.source === 'hybrid' ? 'badge border-accent-line bg-accent-soft text-accent' : 'badge-draft'}>
                {analysis.source === 'hybrid' ? 'Rules + AI feedback' : 'Rule-based'}
              </span>
              {analysis.model ? <p className="text-2xs text-faint">Model: {analysis.model}</p> : null}
              <p className="border-t border-line pt-3 text-center text-2xs leading-5 text-muted">
                This score measures content quality against a fixed rubric. It is not a hiring probability or a
                prediction of career outcomes.
              </p>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-ink">Category scores</h2>
              <div className="mt-3 space-y-2.5">
                {(analysis.categories || []).map((category) => {
                  const ratio = category.score / category.max;
                  return (
                    <div key={category.id}>
                      <ProgressBar
                        label={category.label}
                        value={category.score}
                        max={category.max}
                        tone={ratio >= 0.8 ? 'success' : ratio >= 0.6 ? 'accent' : ratio >= 0.35 ? 'warning' : 'danger'}
                      />
                      {category.detail ? <p className="mt-0.5 text-2xs text-muted">{category.detail}</p> : null}
                    </div>
                  );
                })}
              </div>
              {analysis.aiNotice ? (
                <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-3 text-2xs leading-5 text-muted">
                  <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {analysis.aiNotice}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <AlertTriangle size={15} className="text-warning" aria-hidden="true" />
                Detected issues
                <span className="text-xs font-normal text-muted">({(analysis.issues || []).length})</span>
              </h2>

              {highIssues.length ? (
                <div className="mt-3 rounded border border-danger/20 bg-dangerSoft/50 p-2.5">
                  <p className="text-2xs font-semibold uppercase tracking-wide text-danger">Fix these first</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {highIssues.map((issue) => (
                      <li key={issue.id} className="flex gap-2 text-xs leading-5 text-inkSoft">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_TONE.high.className}`} aria-hidden="true" />
                        <span>
                          <span className="font-medium text-ink">{SECTION_NAMES[issue.section] || issue.section}: </span>
                          {issue.message}
                          {issue.fromAi ? <span className="ml-1 text-2xs text-accent">(AI)</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 rounded border border-success/20 bg-successSoft px-2.5 py-2 text-xs text-success">
                  <CheckCircle2 size={13} aria-hidden="true" /> No high-severity issues detected.
                </p>
              )}

              {otherIssues.length ? (
                <ul className="mt-3 space-y-1.5">
                  {otherIssues.map((issue) => (
                    <li key={issue.id} className="flex gap-2 text-xs leading-5 text-inkSoft">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          SEVERITY_TONE[issue.severity]?.className || SEVERITY_TONE.low.className
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="font-medium text-ink">{SECTION_NAMES[issue.section] || issue.section}: </span>
                        {issue.message}
                        {issue.fromAi ? <span className="ml-1 text-2xs text-accent">(AI)</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ListChecks size={15} className="text-accent" aria-hidden="true" />
                Prioritised recommendations
              </h2>
              {(analysis.recommendations || []).length ? (
                <ol className="mt-3 space-y-2.5">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={`${rec.title}-${index}`} className="rounded border border-line bg-surface p-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge border-lineStrong bg-canvasAlt text-inkSoft">
                          {PRIORITY_LABEL[rec.priority] || 'Next'}
                        </span>
                        <p className="text-xs font-medium text-ink">{rec.title}</p>
                        {rec.fromAi ? <span className="text-2xs text-accent">AI</span> : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-inkSoft">{rec.detail}</p>
                      <p className="mt-1 text-2xs text-muted">Section: {SECTION_NAMES[rec.section] || rec.section}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-xs text-muted">No recommendations — the content is in good shape.</p>
              )}
            </div>
          </div>

          {(analysis.examples || []).length ? (
            <div className="card mt-4 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Wand2 size={15} className="text-accent" aria-hidden="true" />
                Example rewrites
              </h2>
              <p className="mt-1 text-xs text-muted">
                Suggestions use wording patterns, not invented facts. Check every bracketed placeholder before publishing.
              </p>
              <ul className="mt-3 space-y-3">
                {analysis.examples.map((example, index) => (
                  <li key={`${example.label}-${index}`} className="rounded border border-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-ink">{example.label}</p>
                      {example.fromAi ? <span className="text-2xs text-accent">AI suggestion</span> : null}
                    </div>
                    {example.before ? (
                      <p className="mt-2 rounded bg-canvasAlt/70 px-2 py-1.5 text-xs leading-5 text-inkSoft">
                        <span className="font-medium text-ink">Before: </span>
                        {example.before}
                      </p>
                    ) : null}
                    <p className="mt-1.5 rounded border border-accent-line bg-accent-soft/60 px-2 py-1.5 text-xs leading-5 text-inkSoft">
                      <span className="font-medium text-ink">Suggested: </span>
                      {example.after}
                    </p>
                    {example.note ? <p className="mt-1 text-2xs text-muted">{example.note}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => applyExample(example)}
                        loading={applying === example.label}
                        disabled={!example.target}
                      >
                        <CheckCircle2 size={12} aria-hidden="true" /> Apply to portfolio
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyText(example.after)}>
                        <Copy size={12} aria-hidden="true" /> Copy text
                      </Button>
                      {!example.target ? (
                        <span className="self-center text-2xs text-muted">Pattern only — apply manually in the editor.</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-ink">Ready to publish?</p>
              <p className="mt-0.5 text-xs text-muted">
                {portfolio?.published
                  ? 'This portfolio is already public. Edits appear after you save them.'
                  : 'Publishing makes the portfolio available at its public link.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/dashboard/portfolio/${id}/edit`} className="btn-secondary">
                <Pencil size={14} aria-hidden="true" /> Keep editing
              </Link>
              {portfolio?.published && portfolio?.slug ? (
                <a href={`/p/${portfolio.slug}`} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <ExternalLink size={14} aria-hidden="true" /> View public page
                </a>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
