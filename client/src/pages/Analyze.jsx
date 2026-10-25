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
  high: { label: 'High', className: 'bg-red-500', text: 'text-red-700' },
  medium: { label: 'Medium', className: 'bg-amber-500', text: 'text-amber-700' },
  low: { label: 'Low', className: 'bg-slate-400', text: 'text-slate-600' },
};

const PRIORITY_LABEL = { now: 'Fix First', next: 'Next Step', later: 'Optional' };

const SECTION_NAMES = {
  profile: 'Profile',
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  achievements: 'Achievements',
  contact: 'Contact',
  general: 'Writing Quality',
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
            ? 'Displaying cached assessment for this revision. Edit and re-run to refresh.'
            : data.aiUsed
              ? 'Deterministic rubric scores enhanced with contextual AI suggestions.'
              : 'Deterministic rubric analysis completed (AI feedback was skipped or inactive).')
      );
      if (data.usage) setAiStatus((current) => ({ ...(current || {}), usage: data.usage }));
      const refreshed = await portfolioService.get(id);
      setPortfolio(refreshed.portfolio);
      toast.success('Assessment complete.');
    } catch (err) {
      setError(err.message || 'The assessment could not be completed.');
    } finally {
      setRunning(false);
    }
  };

  const applyExample = async (example) => {
    if (!example.target) {
      toast.info('This suggestion is a structural pattern to follow rather than a direct replacement.', {
        description: 'Copy the structure and fill the bracketed placeholders with your personal facts.',
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
        description: 'Verify the bracketed placeholders, then re-run analysis.',
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
      toast.info('Could not copy automatically. Select text and copy manually.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading portfolio assessment…" />
      </div>
    );
  }

  if (error && !analysis && !portfolio) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center bg-surface shadow-card">
        <h1 className="text-xl font-bold text-ink">Analysis unavailable</h1>
        <p className="mt-2 text-xs text-muted">{error}</p>
        <Link to="/dashboard" className="btn-primary mt-5">
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
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-card">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink transition-colors">
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Portfolios</span>
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Portfolio Quality Analysis</h1>
          <p className="mt-0.5 text-xs text-muted">
            {portfolio?.title} · Evaluated against the open 100-point rubric
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/portfolio/${id}/edit`} className="btn-secondary btn-sm">
            <Pencil size={13} aria-hidden="true" />
            <span>Open editor</span>
          </Link>
          <Button variant="primary" size="sm" onClick={() => runAnalysis({ force: true })} loading={running} disabled={running}>
            <RefreshCw size={13} aria-hidden="true" />
            <span>{analysis ? 'Re-run analysis' : 'Run analysis'}</span>
          </Button>
        </div>
      </div>

      {aiStatus ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${aiStatus.configured ? 'bg-emerald-500' : 'bg-amber-400'}`} aria-hidden="true" />
            <span className="font-semibold text-ink">
              {aiStatus.configured ? 'Gemini AI online' : 'Rule-based engine active (Gemini not configured)'}
            </span>
          </div>
          {aiStatus.usage ? (
            <span className="text-2xs text-muted">
              Daily AI allowance: <strong className="text-ink">{aiStatus.usage.used}</strong> / {aiStatus.usage.limit} calls
            </span>
          ) : null}
        </div>
      ) : null}

      {notice ? (
        <Alert tone="info">{notice}</Alert>
      ) : null}

      {stale ? (
        <Alert tone="warning" title="Analysis out of sync">
          The portfolio content was updated after this score was recorded. Click &ldquo;Re-run analysis&rdquo; to assess your latest edits.
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="error" title="Analysis problem">
          {error}
        </Alert>
      ) : null}

      {!analysis ? (
        <div className="card p-8 bg-surface shadow-card text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
            <Gauge size={22} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-ink">No assessment recorded yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted">
            The analyzer systematically evaluates profile completeness, summary strength, project depth, skills specificity,
            education details, and link accessibility. Scoring is deterministic and reproducible; Gemini suggestions provide
            additional qualitative feedback when enabled.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="primary" onClick={() => runAnalysis({ force: true })} loading={running}>
              <Gauge size={14} aria-hidden="true" />
              <span>Run comprehensive analysis</span>
            </Button>
            <Button variant="secondary" onClick={() => runAnalysis({ force: true, useAi: false })} loading={running}>
              Run rules only
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Score + Rubric Breakdown */}
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="card flex flex-col items-center justify-center p-6 bg-surface shadow-card text-center">
              <ScoreRing score={analysis.score} size={148} />
              <div className="mt-3">
                <p className="text-xl font-bold tracking-tight text-ink">{analysis.grade} Rating</p>
                <p className="mt-0.5 text-2xs text-muted">
                  Scored {analysis.generatedAt ? formatRelative(analysis.generatedAt) : 'recently'}
                </p>
              </div>
              <span className={`mt-3 badge ${analysis.source === 'hybrid' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'badge-draft'}`}>
                {analysis.source === 'hybrid' ? 'Rubric + Gemini AI' : 'Deterministic Rubric'}
              </span>
              {analysis.model ? <p className="mt-1 text-2xs text-slate-400">Model: {analysis.model}</p> : null}
              <p className="mt-4 border-t border-line pt-3 text-center text-2xs leading-relaxed text-slate-400">
                Objective score based on transparent portfolio criteria. Non-automated hiring guarantees.
              </p>
            </div>

            <div className="card p-6 bg-surface shadow-card">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <h2 className="text-sm font-bold tracking-tight text-ink">Rubric Category Breakdown</h2>
                <span className="badge-draft text-2xs">100-pt System</span>
              </div>
              <div className="space-y-3">
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
                      {category.detail ? <p className="mt-1 text-2xs text-muted">{category.detail}</p> : null}
                    </div>
                  );
                })}
              </div>
              {analysis.aiNotice ? (
                <div className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-2xs text-slate-500">
                  <Info size={13} className="shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
                  <span>{analysis.aiNotice}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Issues and Recommendations */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card p-6 bg-surface shadow-card">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-ink">
                  <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
                  <span>Detected Areas for Improvement</span>
                </h2>
                <span className="badge-draft text-2xs">{(analysis.issues || []).length} found</span>
              </div>

              {highIssues.length ? (
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 mb-3.5">
                  <p className="text-2xs font-bold uppercase tracking-wider text-red-800">Priority Fixes</p>
                  <ul className="mt-2 space-y-2">
                    {highIssues.map((issue) => (
                      <li key={issue.id} className="flex gap-2 text-xs leading-relaxed text-red-950">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" aria-hidden="true" />
                        <span>
                          <strong className="font-semibold">{SECTION_NAMES[issue.section] || issue.section}: </strong>
                          {issue.message}
                          {issue.fromAi ? <span className="ml-1 text-2xs font-semibold text-indigo-700">(AI)</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 mb-3.5">
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>No critical issues detected. Solid baseline.</span>
                </div>
              )}

              {otherIssues.length ? (
                <ul className="space-y-2 pt-1">
                  {otherIssues.map((issue) => (
                    <li key={issue.id} className="flex gap-2.5 text-xs leading-relaxed text-inkSoft">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          SEVERITY_TONE[issue.severity]?.className || SEVERITY_TONE.low.className
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="font-semibold text-ink">{SECTION_NAMES[issue.section] || issue.section}: </strong>
                        {issue.message}
                        {issue.fromAi ? <span className="ml-1 text-2xs font-semibold text-indigo-700">(AI)</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="card p-6 bg-surface shadow-card">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-ink">
                  <ListChecks size={16} className="text-accent" aria-hidden="true" />
                  <span>Prioritised Next Steps</span>
                </h2>
                <span className="badge-draft text-2xs">Actionable</span>
              </div>

              {(analysis.recommendations || []).length ? (
                <ol className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={`${rec.title}-${index}`} className="rounded-xl border border-line bg-slate-50/50 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge border-line bg-white text-slate-700 font-semibold text-2xs">
                          {PRIORITY_LABEL[rec.priority] || 'Next'}
                        </span>
                        <p className="text-xs font-bold text-ink">{rec.title}</p>
                        {rec.fromAi ? <span className="text-2xs font-semibold text-indigo-700">AI</span> : null}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{rec.detail}</p>
                      <p className="mt-1.5 text-2xs font-medium text-slate-400">Section: {SECTION_NAMES[rec.section] || rec.section}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-muted">All sections satisfy standard rubric expectations.</p>
              )}
            </div>
          </div>

          {/* Example Rewrites */}
          {(analysis.examples || []).length ? (
            <div className="card p-6 bg-surface shadow-card">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-ink">
                  <Wand2 size={16} className="text-accent" aria-hidden="true" />
                  <span>Concrete Rewrite Examples</span>
                </h2>
                <span className="badge-draft text-2xs">Pattern Models</span>
              </div>
              <p className="text-xs leading-relaxed text-muted mb-4">
                Suggestions illustrate high-impact phrasing. Ensure you verify that all facts accurately reflect your work.
              </p>
              <ul className="space-y-3.5">
                {analysis.examples.map((example, index) => (
                  <li key={`${example.label}-${index}`} className="rounded-xl border border-line p-4 bg-slate-50/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-bold text-ink">{example.label}</p>
                      {example.fromAi ? <span className="badge border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold text-2xs">AI Pattern</span> : null}
                    </div>
                    {example.before ? (
                      <div className="rounded-lg bg-slate-100 p-2.5 text-xs text-slate-600 mb-2">
                        <strong className="text-slate-900 font-semibold">Current draft: </strong>
                        {example.before}
                      </div>
                    ) : null}
                    <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/70 p-2.5 text-xs text-slate-800">
                      <strong className="text-indigo-900 font-semibold">Suggested pattern: </strong>
                      {example.after}
                    </div>
                    {example.note ? <p className="mt-2 text-2xs text-muted">{example.note}</p> : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => applyExample(example)}
                        loading={applying === example.label}
                        disabled={!example.target}
                      >
                        <CheckCircle2 size={12} aria-hidden="true" />
                        <span>Apply to portfolio</span>
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => copyText(example.after)}>
                        <Copy size={12} aria-hidden="true" />
                        <span>Copy text</span>
                      </Button>
                      {!example.target ? (
                        <span className="text-2xs text-muted">Structural guide — apply manually in the editor.</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Bottom Callout Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div>
              <p className="text-sm font-bold text-ink">Ready to share your work?</p>
              <p className="mt-0.5 text-xs text-muted">
                {portfolio?.published
                  ? 'Your portfolio is live at its public URL. Any saved updates are reflected immediately.'
                  : 'Publishing generates your unique public link for applications and recruiters.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link to={`/dashboard/portfolio/${id}/edit`} className="btn-secondary btn-sm">
                <Pencil size={13} aria-hidden="true" />
                <span>Open editor</span>
              </Link>
              {portfolio?.published && portfolio?.slug ? (
                <a href={`/p/${portfolio.slug}`} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                  <ExternalLink size={13} aria-hidden="true" />
                  <span>View live page</span>
                </a>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
