import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  Clock,
  Code2,
  Eye,
  FolderTree,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import { Alert, Button, EmptyState } from '../components/ui/Primitives.jsx';
import GenerateForm from '../components/ai/GenerateForm.jsx';
import ProjectWorkspace from '../components/ai/ProjectWorkspace.jsx';
import PremiumLock from '../components/ai/PremiumLock.jsx';
import { aiProjectService } from '../services/aiProjectService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const PHASES = [
  { afterMs: 0, label: 'Planning the structure and file list…' },
  { afterMs: 12000, label: 'Writing the UI components and styles…' },
  { afterMs: 45000, label: 'Writing the logic, API routes and database models…' },
  { afterMs: 110000, label: 'Completing the remaining files…' },
  { afterMs: 170000, label: 'Checking every file and preparing the preview…' },
];

const newRequestId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

export default function AiProjectBuilder() {
  const { isPremium, loading: authLoading, refreshSubscription } = useAuth();
  const toast = useToast();

  const [meta, setMeta] = useState(null);
  const [credits, setCredits] = useState(null);
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [premiumBlocked, setPremiumBlocked] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState('');
  const [genError, setGenError] = useState('');
  const [genErrorCode, setGenErrorCode] = useState('');
  const phaseTimer = useRef(null);
  const workspaceRef = useRef(null);
  const generatingRef = useRef(false);

  const stopPhases = () => {
    if (phaseTimer.current) {
      clearInterval(phaseTimer.current);
      phaseTimer.current = null;
    }
  };

  useEffect(() => () => stopPhases(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [metaData, listData] = await Promise.all([aiProjectService.meta(), aiProjectService.list()]);
      setMeta(metaData);
      setProjects(listData.projects || []);
      setCredits(listData.credits || null);
      setPremiumBlocked(false);
    } catch (error) {
      if (error?.code === 'PREMIUM_REQUIRED' || error?.status === 403) {
        setPremiumBlocked(true);
      } else {
        setLoadError(error.message || 'The AI workspace could not be loaded.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isPremium) {
      setLoading(false);
      return;
    }
    // The user may have upgraded in another tab or after the server rejected a
    // generation; never keep showing the lock once the account is premium.
    setPremiumBlocked(false);
    load();
  }, [authLoading, isPremium, load]);

  const refreshList = useCallback(async () => {
    try {
      const data = await aiProjectService.list();
      setProjects(data.projects || []);
      if (data.credits) setCredits(data.credits);
    } catch {
      /* the workspace still works with the project already open */
    }
  }, []);

  const openProject = async (id) => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await aiProjectService.get(id);
      setProject(data.project);
      setIssues(data.issues || []);
      setCredits(data.credits || credits);
      requestAnimationFrame(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (error) {
      toast.error(error.message || 'That project could not be opened.');
    } finally {
      setLoading(false);
    }
  };

  const generate = async (input) => {
    // A double-click can fire two click handlers before React re-renders the
    // disabled button. The ref closes that window; the server also has a
    // requestId + unique index as the final guard.
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenError('');
    setGenErrorCode('');
    setGenerating(true);
    setPhase(PHASES[0].label);
    const started = Date.now();
    phaseTimer.current = setInterval(() => {
      const elapsed = Date.now() - started;
      const current = [...PHASES].reverse().find((step) => elapsed >= step.afterMs) || PHASES[0];
      setPhase(current.label);
    }, 2000);

    try {
      const data = await aiProjectService.generate({ ...input, requestId: newRequestId() });
      setProject(data.project);
      setIssues(data.issues || []);
      setCredits(data.credits || null);
      await refreshList();
      toast.success('Project generated.', {
        description: `${data.project.files.length} files are ready to preview, edit and download.`,
      });
      requestAnimationFrame(() => workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (error) {
      if (error?.code === 'PREMIUM_REQUIRED') {
        setPremiumBlocked(true);
        await refreshSubscription();
      } else {
        setGenError(error.message || 'Generation failed. Nothing was saved.');
        setGenErrorCode(error?.code || '');
        await refreshList();
      }
    } finally {
      stopPhases();
      setPhase('');
      setGenerating(false);
      generatingRef.current = false;
    }
  };

  const onProjectChange = (next, nextIssues, nextCredits) => {
    setProject(next);
    if (nextIssues) setIssues(nextIssues);
    if (nextCredits) setCredits(nextCredits);
    refreshList();
  };

  const back = () => {
    setProject(null);
    setIssues([]);
    setGenError('');
    setGenErrorCode('');
    refreshList();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={18} className="animate-spin text-accent" aria-label="Loading" />
      </div>
    );
  }

  if (!isPremium || premiumBlocked) return <PremiumLock />;

  if (loading && !project) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-canvasAlt" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="surface-card h-80 animate-pulse" />
          <div className="surface-card h-52 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div ref={workspaceRef} className="space-y-5">
      {project ? (
        <ProjectWorkspace
          project={project}
          issues={issues}
          credits={credits}
          onBack={back}
          onProjectChange={onProjectChange}
          onDeleted={back}
        />
      ) : (
        <>
          <PageHeader
            eyebrow="Premium"
            title="AI Project Builder"
            description="Describe an idea, choose a stack, and get a complete project with real files, a README and setup steps."
            actions={
              <>
                {credits ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-accent-line bg-accent-soft px-2.5 py-1.5 text-[11.5px] font-semibold text-accent-hover">
                    <Sparkles size={12} aria-hidden="true" />
                    {credits.remaining} of {credits.limit} credits
                  </span>
                ) : null}
                <Button variant="secondary" size="sm" onClick={load} loading={loading}>
                  <RefreshCcw size={13} aria-hidden="true" />
                  Refresh
                </Button>
              </>
            }
          />

          {loadError ? (
            <Alert tone="error" title="The AI workspace is unavailable">
              {loadError}
            </Alert>
          ) : null}

          {meta && !meta.aiAvailable ? (
            <Alert tone="warning" title="AI provider not configured">
              Generation is disabled until the server has a provider key. Set <code className="font-mono text-[11px]">GEMINI_PROJECT_API_KEY</code>{' '}
              (or <code className="font-mono text-[11px]">AI_PROVIDER=openai</code> and{' '}
              <code className="font-mono text-[11px]">OPENAI_API_KEY</code>). Your existing projects are still available below.
            </Alert>
          ) : null}

          <GenerateForm
            meta={meta}
            credits={credits}
            aiAvailable={Boolean(meta?.aiAvailable)}
            onGenerate={generate}
            busy={generating}
            phase={phase}
            error={genError}
            errorCode={genErrorCode}
          />

          {generating ? (
            <div className="surface-card border-accent-line p-4">
              <div className="flex items-center gap-2.5">
                <Loader2 size={15} className="animate-spin text-accent" aria-hidden="true" />
                <p className="text-[12.5px] font-medium text-ink">{phase}</p>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-canvasAlt">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
              </div>
              <p className="mt-2 text-[11px] leading-5 text-muted">
                This can take up to four minutes for a full-stack project. Every manifest file is checked before the
                result is saved; if the provider fails or a file is missing, nothing partial is saved and the credit is
                returned.
              </p>
            </div>
          ) : null}

          {/* Recent projects */}
          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted">Your AI projects</h2>
              <span className="text-[11px] text-faint">{projects.length} saved</span>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                icon={FolderTree}
                title="No generated projects yet"
                description="Your first generated project appears here, ready to preview, edit and add to a portfolio."
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openProject(item.id)}
                    className="group surface-card flex flex-col p-4 text-left transition-colors hover:border-lineStrong"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-ink">{item.title}</p>
                      <ChevronRight
                        size={14}
                        className="mt-0.5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-5 text-muted">{item.description || item.idea}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-faint">
                      <span className="inline-flex items-center gap-1">
                        <Code2 size={10} aria-hidden="true" />
                        {item.stackLabel}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FolderTree size={10} aria-hidden="true" />
                        {item.fileCount} files
                      </span>
                      {item.previewSupported ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <Eye size={10} aria-hidden="true" />
                          Preview
                        </span>
                      ) : null}
                      <span className="ml-auto inline-flex items-center gap-1">
                        <Clock size={10} aria-hidden="true" />
                        {dateLabel(item.generatedAt || item.createdAt)}
                      </span>
                    </div>
                    {item.status !== 'ready' ? (
                      <span className="mt-2 inline-flex w-fit rounded-full border border-warningLine bg-warningSoft px-2 py-0.5 text-[10px] text-warning">
                        {item.status === 'generating' ? 'Still generating' : 'Generation failed'}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            {projects.length ? (
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
                <Plus size={11} aria-hidden="true" />
                Generate a new project above; previous projects stay saved.
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
