import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileUp,
  Gauge,
  Globe2,
  Info,
  Loader2,
  RefreshCw,
  ScanLine,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { Alert, Button, ScoreRing, Spinner } from '../components/ui/Primitives.jsx';
import { PageHeader } from '../components/ui/Kit.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { scanService } from '../services/scanService.js';
import useAiStatus from '../hooks/useAiStatus.js';
import { formatRelative } from '../utils/format.js';
import { draftFromPortfolio, draftToPayload } from '../utils/portfolioDraft.js';
import { getTemplate } from '../utils/templates.js';

const SEVERITY_TONE = {
  high: { label: 'High', dot: 'bg-danger', chip: 'bg-dangerSoft text-danger' },
  medium: { label: 'Medium', dot: 'bg-warning', chip: 'bg-warningSoft text-warning' },
  low: { label: 'Low', dot: 'bg-faint', chip: 'bg-canvas text-muted shadow-neu-inset-xs' },
};

const SCAN_CATEGORIES = [
  { id: 'seo', label: 'SEO' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'performance', label: 'Performance' },
  { id: 'responsive', label: 'Responsiveness' },
  { id: 'code', label: 'Code quality' },
  { id: 'design', label: 'Visual hierarchy' },
];

const SECTION_LABELS = {
  profile: 'Profile',
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience',
  education: 'Education',
  achievements: 'Achievements',
  contact: 'Contact',
  general: 'Writing quality',
};

function ScoreBars({ categories }) {
  return (
    <ul className="space-y-3">
      {categories.map((category) => {
        const pct = Math.round((category.score / category.max) * 100);
        const tone = pct >= 80 ? 'bg-success' : pct >= 55 ? 'bg-accent' : 'bg-warning';
        return (
          <li key={category.id}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-inkSoft">{category.label}</span>
              <span className="font-mono text-faint">
                {category.score}/{category.max}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-canvasAlt" role="presentation">
              <div className={`h-full rounded-full ${tone} transition-colors duration-700`} style={{ width: `${pct}%` }} />
            </div>
            {category.detail ? <p className="mt-1 text-[10px] leading-relaxed text-faint">{category.detail}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function Analyzer() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { status: aiStatus, setStatus: setAiStatus, reload: reloadAiStatus } = useAiStatus();

  const [mode, setMode] = useState(routeId ? 'portfolio' : 'portfolio');
  const [portfolios, setPortfolios] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState(routeId || '');
  const [portfolio, setPortfolio] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [selectedExamples, setSelectedExamples] = useState([]);

  // Website scan state
  const [scanTab, setScanTab] = useState('url');
  const [scanUrlValue, setScanUrlValue] = useState('');
  const [scanFile, setScanFile] = useState(null);
  const [scanCategories, setScanCategories] = useState(SCAN_CATEGORIES.map((category) => category.id));
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scanLog, setScanLog] = useState('');

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await portfolioService.list({ sort: 'updated' });
      setPortfolios(data.portfolios || []);
      if (!routeId && data.portfolios?.length) setSelectedId((current) => current || data.portfolios[0].id);
    } catch (err) {
      setError(err.message || 'Could not load your portfolios.');
    } finally {
      setLoadingList(false);
    }
  }, [routeId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadPortfolio = useCallback(
    async (portfolioId) => {
      if (!portfolioId) return;
      setLoadingPortfolio(true);
      setError('');
      setNotice('');
      try {
        const data = await portfolioService.get(portfolioId);
        setPortfolio(data.portfolio);
        setAnalysis(data.portfolio.analysis || null);
        setSelectedExamples([]);
        reloadAiStatus();
      } catch (err) {
        setError(err.status === 404 ? 'This portfolio does not exist or belongs to another account.' : err.message);
      } finally {
        setLoadingPortfolio(false);
      }
    },
    [reloadAiStatus]
  );

  useEffect(() => {
    if (selectedId) loadPortfolio(selectedId);
  }, [selectedId, loadPortfolio]);

  const runAnalysis = async ({ force = true, useAi = true } = {}) => {
    if (!selectedId) return;
    setRunning(true);
    setError('');
    setNotice('');
    try {
      const data = await portfolioService.analyze(selectedId, { force, useAi });
      setAnalysis(data.analysis);
      setNotice(
        data.notice ||
          (data.cached
            ? 'Showing the stored assessment for this revision.'
            : data.aiUsed
              ? 'Deterministic scores plus clearly-labelled AI observations.'
              : 'Deterministic rubric analysis complete.')
      );
      if (data.usage) setAiStatus((current) => ({ ...(current || {}), usage: data.usage }));
      const refreshed = await portfolioService.get(selectedId);
      setPortfolio(refreshed.portfolio);
      setSelectedExamples([]);
      toast.success('Analysis complete.');
    } catch (err) {
      setError(err.message || 'The analysis could not be completed.');
    } finally {
      setRunning(false);
    }
  };

  const applyableExamples = (analysis?.examples || []).filter((example) => example.target);

  const applySelected = async () => {
    if (!selectedExamples.length || !portfolio) return;
    setApplying(true);
    try {
      const draft = draftFromPortfolio(portfolio);
      let next = { ...draft };
      let projectChanges = [...next.projects];
      let bioChanged = false;

      selectedExamples.forEach((label) => {
        const example = applyableExamples.find((item) => item.label === label);
        if (!example) return;
        if (example.target.kind === 'bio') {
          next.profile = { ...next.profile, bio: example.after };
          bioChanged = true;
        } else if (example.target.kind === 'project') {
          projectChanges = projectChanges.map((project) =>
            project.name === example.target.name ? { ...project, description: example.after } : project
          );
        }
      });

      next.projects = projectChanges;
      await portfolioService.update(portfolio.id, draftToPayload(next));
      toast.success('Selected suggestions applied to your draft.', {
        description: bioChanged
          ? 'Placeholders in brackets were added intentionally — replace them with your facts before publishing.'
          : 'Open the editor to refine the wording.',
      });
      setSelectedExamples([]);
      await loadPortfolio(portfolio.id);
      navigate(`/dashboard/portfolio/${portfolio.id}/edit`);
    } catch (err) {
      toast.error(err.message || 'Could not apply the suggestions.');
    } finally {
      setApplying(false);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard.');
    } catch {
      toast.info('Could not copy automatically. Select the text and copy it manually.');
    }
  };

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Choose an HTML file first.'));
      if (file.size > 600 * 1024) return reject(new Error('That file is larger than 600 KB. Upload a single HTML page.'));
      if (!/\.(html?|htm)$/i.test(file.name) && !file.type.includes('html')) {
        return reject(new Error('Upload an .html file. PDF and image analysis is not supported.'));
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read that file.'));
      reader.readAsText(file);
    });

  const runScan = async () => {
    setScanning(true);
    setScanError('');
    setScanResult(null);
    setScanLog(scanTab === 'url' ? 'Resolving host and fetching page…' : 'Reading uploaded document…');
    try {
      let data;
      if (scanTab === 'url') {
        if (!/^https?:\/\/.+\..+/i.test(scanUrlValue.trim())) {
          throw new Error('Enter a full public URL, for example https://your-name.vercel.app');
        }
        setScanLog('Page fetched. Scoring SEO, accessibility, performance and markup…');
        data = await scanService.scanUrl(scanUrlValue.trim(), scanCategories);
      } else {
        const html = await readFile(scanFile);
        setScanLog('Document loaded. Running deterministic checks…');
        data = await scanService.scanHtml(html, scanFile?.name, scanCategories);
      }
      setScanResult(data.analysis);
      setScanLog('');
    } catch (err) {
      setScanError(err.message || 'The scan could not be completed.');
      setScanLog('');
    } finally {
      setScanning(false);
    }
  };

  const stale =
    analysis && portfolio?.updatedAt && analysis.generatedAt
      ? new Date(portfolio.updatedAt) > new Date(analysis.generatedAt)
      : false;

  const highCount = useMemo(() => (analysis?.issues || []).filter((issue) => issue.severity === 'high').length, [analysis]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Portfolio analysis"
        description="Run the deterministic 100-point rubric on your own portfolio, or scan any live page for SEO, accessibility, responsiveness, performance and markup issues."
        actions={
          <>
            <div className="segmented" role="tablist" aria-label="Analyzer mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'portfolio'}
                onClick={() => setMode('portfolio')}
                className={`segmented-item ${mode === 'portfolio' ? 'segmented-item-active' : ''}`}
              >
                My portfolio
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'scan'}
                onClick={() => setMode('scan')}
                className={`segmented-item ${mode === 'scan' ? 'segmented-item-active' : ''}`}
              >
                Website scan
              </button>
            </div>
          </>
        }
      />

      {mode === 'portfolio' ? (
        <>
          <div className="card p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label htmlFor="analyzer-portfolio" className="label">
                  Portfolio
                </label>
                <select
                  id="analyzer-portfolio"
                  className="select"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  disabled={loadingList}
                >
                  {portfolios.length === 0 ? <option value="">No portfolios yet</option> : null}
                  {portfolios.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} · {getTemplate(item.templateId).name}
                      {item.published ? ' · Published' : ' · Draft'}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={() => runAnalysis({ force: true, useAi: true })} loading={running} disabled={!selectedId}>
                <ScanLine size={14} aria-hidden="true" />
                Run analysis
              </Button>
              {analysis ? (
                <Button variant="secondary" onClick={() => runAnalysis({ force: true, useAi: true })} disabled={running}>
                  <RefreshCw size={14} aria-hidden="true" />
                  Rescan
                </Button>
              ) : null}
              {selectedId ? (
                <Link to={`/dashboard/portfolio/${selectedId}/edit`} className="btn-ghost btn-sm">
                  Open editor
                </Link>
              ) : null}
            </div>

            {portfolios.length === 0 && !loadingList ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 neu-inset-sm p-4">
                <p className="text-sm text-muted">You need a portfolio before you can analyse one.</p>
                <Link to="/dashboard/builder" className="btn-primary btn-sm">
                  <Sparkles size={13} aria-hidden="true" />
                  Create with AI
                </Link>
              </div>
            ) : null}
          </div>

          {error ? <Alert tone="error" title="Analysis unavailable">{error}</Alert> : null}
          {notice ? <Alert tone="info">{notice}</Alert> : null}

          {loadingPortfolio ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading portfolio…" />
            </div>
          ) : !portfolio ? (
            <div className="card flex flex-col items-center px-6 py-14 text-center">
              <Gauge size={26} className="text-faint" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-ink">
                {portfolios.length ? 'Choose a portfolio above' : 'No portfolio selected'}
              </p>
              <p className="mt-1 max-w-sm text-xs text-muted">
                The analyser reviews portfolio content: completeness, clarity, project depth, skills, experience, links
                and readability.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
              <div className="space-y-4">
                <div className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{portfolio.title}</p>
                      <p className="text-[11px] text-muted">
                        {getTemplate(portfolio.templateId).name} · updated {formatRelative(portfolio.updatedAt)}
                      </p>
                    </div>
                    <span className={portfolio.published ? 'badge-published' : 'badge-draft'}>
                      {portfolio.published ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col items-center">
                    {analysis ? (
                      <>
                        <ScoreRing score={analysis.score} label="Portfolio score" />
                        <p className="mt-2 text-sm font-medium text-ink">{analysis.grade}</p>
                        <p className="mt-0.5 text-[11px] text-faint">
                          {analysis.source === 'hybrid' ? 'Rules + AI observations' : 'Rule-based rubric'} ·{' '}
                          {analysis.generatedAt ? formatRelative(analysis.generatedAt) : 'not dated'}
                        </p>
                      </>
                    ) : (
                      <div className="py-6 text-center">
                        <Gauge size={30} className="mx-auto text-faint" aria-hidden="true" />
                        <p className="mt-3 text-sm font-medium text-ink">No analysis for this revision yet</p>
                        <p className="mt-1 max-w-[240px] text-xs text-muted">Run the analyser to score the current content.</p>
                        <Button className="mt-4" size="sm" onClick={() => runAnalysis({ force: true, useAi: true })} loading={running}>
                          <ScanLine size={13} aria-hidden="true" />
                          Run analysis
                        </Button>
                      </div>
                    )}
                  </div>

                  {analysis ? (
                    <div className="mt-5 space-y-2 border-t border-line pt-4">
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <Info size={12} aria-hidden="true" />
                        AI feedback {aiStatus?.configured ? 'is configured' : 'is not configured'} on this server.
                      </div>
                      {stale ? (
                        <div className="flex items-start gap-2 rounded-tile bg-warningSoft shadow-neu-inset-xs px-2.5 py-2 text-[11px] text-warning">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                          You edited this portfolio after the analysis. Rescan for an accurate score.
                        </div>
                      ) : null}
                      {highCount ? (
                        <div className="flex items-start gap-2 rounded-tile bg-dangerSoft shadow-neu-inset-xs px-2.5 py-2 text-[11px] text-danger">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                          {highCount} high-severity issue{highCount === 1 ? '' : 's'} to address.
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {analysis ? (
                  <div className="card p-5">
                    <p className="text-sm font-semibold text-ink">Category scores</p>
                    <div className="mt-4">
                      <ScoreBars categories={analysis.categories || []} />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                {analysis ? (
                  <>
                    <div className="card p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink">Issues</p>
                        <span className="text-[11px] text-faint">{(analysis.issues || []).length} found</span>
                      </div>
                      {analysis.issues?.length ? (
                        <ul className="mt-4 space-y-2">
                          {analysis.issues.map((issue) => {
                            const tone = SEVERITY_TONE[issue.severity] || SEVERITY_TONE.low;
                            return (
                              <li key={issue.id} className="flex items-start gap-3 neu-inset-sm p-3">
                                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs leading-relaxed text-inkSoft">{issue.message}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-faint">
                                    <span className={`rounded-full px-2 py-0.5 font-semibold ${tone.chip}`}>{tone.label}</span>
                                    <span>{SECTION_LABELS[issue.section] || issue.section}</span>
                                    {issue.fromAi ? <span className="text-accent-hover">AI observation</span> : null}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="mt-4 flex items-center gap-2 rounded-tile bg-successSoft shadow-neu-inset-xs p-3 text-xs text-success">
                          <CheckCircle2 size={14} aria-hidden="true" />
                          No issues were detected by the rubric.
                        </div>
                      )}
                    </div>

                    {analysis.recommendations?.length ? (
                      <div className="card p-5">
                        <p className="text-sm font-semibold text-ink">Recommendations</p>
                        <ol className="mt-4 space-y-3">
                          {analysis.recommendations.map((recommendation, index) => (
                            <li key={`${recommendation.title}-${index}`} className="neu-inset-sm p-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-hover">
                                  {recommendation.priority === 'now' ? 'Fix first' : recommendation.priority === 'next' ? 'Next' : 'Later'}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-faint">
                                  {SECTION_LABELS[recommendation.section] || recommendation.section}
                                </span>
                                {recommendation.fromAi ? <span className="text-[10px] text-accent-hover">AI</span> : null}
                              </div>
                              <p className="mt-1.5 text-xs font-medium text-ink">{recommendation.title}</p>
                              <p className="mt-1 text-xs leading-relaxed text-muted">{recommendation.detail}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}

                    {applyableExamples.length ? (
                      <div className="card p-5">
                        <p className="text-sm font-semibold text-ink">Suggested rewrites</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted">
                          These are structural patterns containing brackets. Apply them only if you intend to replace
                          every bracketed placeholder with your own facts.
                        </p>
                        <ul className="mt-4 space-y-3">
                          {applyableExamples.map((example) => (
                            <li key={example.label} className="neu-inset-sm p-3">
                              <label className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  className="checkbox mt-0.5"
                                  checked={selectedExamples.includes(example.label)}
                                  onChange={(event) =>
                                    setSelectedExamples((current) =>
                                      event.target.checked ? [...current, example.label] : current.filter((item) => item !== example.label)
                                    )
                                  }
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block text-xs font-medium text-ink">{example.label}</span>
                                  <span className="mt-1 block whitespace-pre-line text-[11px] leading-relaxed text-muted">{example.after}</span>
                                  {example.note ? <span className="mt-1 block text-[10px] text-faint">{example.note}</span> : null}
                                </span>
                              </label>
                              <div className="mt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => copyText(example.after)} className="btn-ghost btn-sm">
                                  <Copy size={12} aria-hidden="true" />
                                  Copy
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                          <p className="text-[11px] text-faint">{selectedExamples.length} selected</p>
                          <Button size="sm" onClick={applySelected} loading={applying} disabled={!selectedExamples.length}>
                            <Wand2 size={13} aria-hidden="true" />
                            Apply selected
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="card p-5">
                    <p className="text-sm font-semibold text-ink">What gets scored</p>
                    <ul className="mt-3 space-y-2 text-xs text-muted">
                      {[
                        'Completeness — 25 points across eight core elements',
                        'Summary clarity — 15 points',
                        'Project description quality — 20 points',
                        'Skills coverage — 10 points',
                        'Education and experience — 15 points',
                        'Links and contactability — 10 points',
                        'Readability and consistency — 5 points',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check size={12} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
                      Scores are deterministic and reproducible. AI feedback, when enabled, adds observations and
                      rewrites but never changes the numeric score.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Website scan */}
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
            <div className="card p-5">
              <div className="segmented flex w-full" role="tablist" aria-label="Scan source">
                <button
                  type="button"
                  role="tab"
                  aria-selected={scanTab === 'url'}
                  onClick={() => setScanTab('url')}
                  className={`segmented-item flex-1 ${scanTab === 'url' ? 'segmented-item-active' : ''}`}
                >
                  <Globe2 size={11} className="mr-1 inline" aria-hidden="true" />
                  Live URL
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={scanTab === 'file'}
                  onClick={() => setScanTab('file')}
                  className={`segmented-item flex-1 ${scanTab === 'file' ? 'segmented-item-active' : ''}`}
                >
                  <FileUp size={11} className="mr-1 inline" aria-hidden="true" />
                  HTML file
                </button>
              </div>

              {scanTab === 'url' ? (
                <div className="mt-4">
                  <label htmlFor="scan-url" className="label">
                    Portfolio URL
                  </label>
                  <input
                    id="scan-url"
                    type="url"
                    className="input"
                    placeholder="https://your-name.vercel.app"
                    value={scanUrlValue}
                    onChange={(event) => setScanUrlValue(event.target.value)}
                  />
                  <p className="hint">The server fetches the page itself. Private and local addresses are blocked.</p>
                </div>
              ) : (
                <div className="mt-4">
                  <label htmlFor="scan-file" className="label">
                    Upload an .html file
                  </label>
                  <input
                    id="scan-file"
                    type="file"
                    accept=".html,.htm,text/html"
                    onChange={(event) => setScanFile(event.target.files?.[0] || null)}
                    className="block w-full cursor-pointer neu-inset-sm px-3 py-2 text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-canvasAlt file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink"
                  />
                  <p className="hint">Single HTML document up to 600 KB. PDF and screenshot analysis is not supported.</p>
                </div>
              )}

              <fieldset className="mt-5">
                <legend className="label">Categories</legend>
                <div className="grid grid-cols-2 gap-1.5">
                  {SCAN_CATEGORIES.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 text-xs text-inkSoft">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={scanCategories.includes(category.id)}
                        onChange={(event) =>
                          setScanCategories((current) =>
                            event.target.checked ? [...current, category.id] : current.filter((id) => id !== category.id)
                          )
                        }
                      />
                      {category.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button className="mt-5 w-full justify-center" onClick={runScan} loading={scanning} disabled={!scanCategories.length}>
                <ScanLine size={14} aria-hidden="true" />
                {scanResult ? 'Rescan' : 'Scan website'}
              </Button>

              <p className="mt-3 text-[10px] leading-relaxed text-faint">
                Scans evaluate the delivered HTML only. External stylesheets, JavaScript execution, Core Web Vitals and
                server configuration are not measured, and the report says so.
              </p>
            </div>

            <div className="space-y-4">
              {scanError ? <Alert tone="error" title="Scan failed">{scanError}</Alert> : null}
              {scanning ? (
                <div className="card flex flex-col items-center justify-center p-10 text-center">
                  <Loader2 size={26} className="animate-spin text-accent-hover" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-ink">Scanning…</p>
                  <p className="mt-1 text-xs text-muted">{scanLog || 'Working…'}</p>
                </div>
              ) : null}

              {!scanning && !scanResult ? (
                <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
                  <ScanLine size={26} className="text-faint" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-ink">No scan yet</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
                    Scan a live portfolio URL or upload an exported HTML page. Results include a score per category,
                    severity-ranked issues and copyable recommendations.
                  </p>
                </div>
              ) : null}

              {scanResult ? (
                <>
                  <div className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">Scan report</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">{scanResult.scannedUrl || 'Uploaded document'}</p>
                        <p className="mt-1 text-[10px] text-faint">
                          Scanned {formatRelative(scanResult.generatedAt)} · {scanResult.stats.documentKb} KB ·{' '}
                          {scanResult.stats.images} images · {scanResult.stats.scripts} scripts
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[32px] font-semibold tabular-nums tracking-[-0.02em] text-ink">{scanResult.score}</p>
                          <p className="text-[10px] uppercase tracking-widest text-faint">of 100</p>
                        </div>
                        <span className="badge border-accent-line/50 bg-accent-soft text-accent-hover">{scanResult.grade}</span>
                      </div>
                    </div>

                    <div className="mt-5">
                      <ScoreBars categories={scanResult.categories} />
                    </div>
                  </div>

                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">Findings</p>
                      <span className="text-[11px] text-faint">{scanResult.issues.length} issues</span>
                    </div>
                    {scanResult.issues.length ? (
                      <ul className="mt-4 space-y-2">
                        {scanResult.issues.map((issue) => {
                          const tone = SEVERITY_TONE[issue.severity] || SEVERITY_TONE.low;
                          return (
                            <li key={issue.id} className="neu-inset-sm p-3">
                              <div className="flex items-start gap-2.5">
                                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-ink">{issue.message}</p>
                                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{issue.detail}</p>
                                  <p className="mt-1.5 neu-inset-sm px-2.5 py-1.5 text-[11px] leading-relaxed text-inkSoft">
                                    <strong className="font-semibold text-ink">Fix: </strong>
                                    {issue.recommendation}
                                  </p>
                                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-faint">
                                    <span className={`rounded-full px-2 py-0.5 font-semibold ${tone.chip}`}>{tone.label}</span>
                                    <span className="capitalize">{issue.category}</span>
                                    <button type="button" onClick={() => copyText(`${issue.message}\n${issue.detail}\nFix: ${issue.recommendation}`)} className="ml-auto inline-flex items-center gap-1 text-accent-hover hover:text-ink">
                                      <Copy size={10} aria-hidden="true" />
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="mt-4 flex items-center gap-2 rounded-tile bg-successSoft shadow-neu-inset-xs p-3 text-xs text-success">
                        <CheckCircle2 size={14} aria-hidden="true" />
                        No issues detected in the delivered HTML.
                      </div>
                    )}
                  </div>

                  {scanResult.notes?.length ? (
                    <div className="card p-5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <Info size={14} className="text-accent-hover" aria-hidden="true" />
                        Scan limitations
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {scanResult.notes.map((note) => (
                          <li key={note} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                            <ChevronDown size={11} className="mt-0.5 shrink-0 text-faint" aria-hidden="true" />
                            {note}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
                        Scanned sites are read-only: PortiAI cannot modify a site it does not host. Use the
                        recommendations as a checklist.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
