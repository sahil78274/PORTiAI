import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
  Send,
  User,
  Wrench,
  GraduationCap,
  FolderGit2,
  Briefcase,
  Palette,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Button, ProgressBar, Spinner, TextInput } from '../components/ui/Primitives.jsx';
import PortfolioRenderer from '../templates/PortfolioRenderer.jsx';
import TemplatePreviewFrame from '../components/marketing/TemplatePreviewFrame.jsx';
import {
  ProfileSection,
  SkillsSection,
  EducationSection,
  ProjectsSection,
  ExperienceSection,
  DesignSection,
  SectionsSection,
} from '../components/editor/PortfolioForm.jsx';
import useUnsavedWarning from '../components/editor/useUnsavedWarning.js';
import { draftFromPortfolio, draftToPayload, emptyDraft } from '../utils/portfolioDraft.js';
import { portfolioService } from '../services/portfolioService.js';
import { useToast } from '../context/ToastContext.jsx';
import { getTemplate, normalizeTemplateId, TEMPLATES } from '../utils/templates.js';

const STEPS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'review', label: 'Review', icon: Eye },
];

const STORAGE_KEY = 'portiai_wizard_draft_id';

export default function CreateWizard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const templateParam = params.get('template');
  const [portfolioId, setPortfolioId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [fieldWarning, setFieldWarning] = useState('');

  useUnsavedWarning(dirty);

  // Guards against React 18/19 StrictMode running this effect twice in
  // development, which would otherwise create two draft portfolios.
  const initStarted = useRef(false);

  // Create (or resume) a real draft record so nothing typed here is lost.
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const init = async () => {
      setLoading(true);
      setError('');
      const storedId = sessionStorage.getItem(STORAGE_KEY);
      const requestedTemplate = templateParam ? normalizeTemplateId(templateParam) : null;
      try {
        if (storedId) {
          try {
            const data = await portfolioService.get(storedId);
            const loadedDraft = draftFromPortfolio(data.portfolio);
            if (requestedTemplate && loadedDraft.templateId !== requestedTemplate) {
              const templateObj = getTemplate(requestedTemplate);
              const defaultAccents = TEMPLATES.map((t) => t.accent);
              const shouldUpdateAccent = !loadedDraft.theme?.accent || defaultAccents.includes(loadedDraft.theme.accent);
              const updatedDraft = {
                ...loadedDraft,
                templateId: requestedTemplate,
                theme: {
                  ...loadedDraft.theme,
                  accent: shouldUpdateAccent ? templateObj.accent : loadedDraft.theme.accent,
                },
              };
              setPortfolioId(data.portfolio.id);
              setDraft(updatedDraft);
              await portfolioService.update(data.portfolio.id, draftToPayload(updatedDraft));
              return;
            }
            setPortfolioId(data.portfolio.id);
            setDraft(loadedDraft);
            return;
          } catch {
            sessionStorage.removeItem(STORAGE_KEY);
          }
        }

        const templateObj = requestedTemplate ? getTemplate(requestedTemplate) : TEMPLATES[0];
        const created = await portfolioService.create(
          requestedTemplate
            ? { templateId: requestedTemplate, theme: { accent: templateObj.accent } }
            : {}
        );
        setPortfolioId(created.portfolio.id);
        setDraft(draftFromPortfolio(created.portfolio));
        sessionStorage.setItem(STORAGE_KEY, created.portfolio.id);
      } catch (err) {
        setError(err.message || 'Could not start a new portfolio.');
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDraft = useCallback((next) => {
    setDraft(next);
    setDirty(true);
    setFieldWarning('');
  }, []);

  const save = useCallback(
    async ({ quiet = false } = {}) => {
      if (!portfolioId) return false;
      setSaving(true);
      try {
        const payload = draftToPayload(draft);
        if (!payload.title || payload.title === 'Untitled portfolio') {
          payload.title = payload.profile.fullName
            ? `${payload.profile.fullName} — Portfolio`
            : payload.title;
        }
        const data = await portfolioService.update(portfolioId, payload);
        setDraft(draftFromPortfolio(data.portfolio));
        setDirty(false);
        setLastSaved(new Date());
        if (!quiet) toast.success('Draft saved.');
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not save your portfolio.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [draft, portfolioId, toast]
  );

  const goNext = async () => {
    if (step === 0 && !draft.profile.fullName.trim()) {
      setFieldWarning('Add your full name before continuing — it is required by every template.');
      return;
    }
    const saved = await save({ quiet: true });
    if (!saved) return;
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  };

  const goBack = () => setStep((current) => Math.max(0, current - 1));

  const publish = async () => {
    setPublishing(true);
    try {
      const saved = await save({ quiet: true });
      if (!saved) throw new Error('Save the draft before publishing.');
      const data = await portfolioService.setPublished(portfolioId, true);
      sessionStorage.removeItem(STORAGE_KEY);
      toast.success('Portfolio published.', { description: 'Your public link is live.' });
      navigate(`/dashboard/portfolio/${data.portfolio.id}/analyze`);
    } catch (err) {
      toast.error(err.message || 'Could not publish the portfolio.');
    } finally {
      setPublishing(false);
    }
  };

  const finishToEditor = async () => {
    const saved = await save({ quiet: true });
    if (!saved) return;
    sessionStorage.removeItem(STORAGE_KEY);
    navigate(`/dashboard/portfolio/${portfolioId}/edit`);
  };

  const StepIcon = STEPS[step].icon;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Preparing your new portfolio workspace…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50 p-6 rounded-xl">
        <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
          <AlertCircle size={16} aria-hidden="true" /> {error}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow">Portfolio Wizard</span>
            <span className="badge-draft text-2xs">Step {step + 1} of {STEPS.length}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {STEPS[step].label} Details
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            All fields auto-save to your account. You can revisit and customize any step later in the full editor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 text-2xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
              Unsaved changes
            </span>
          ) : lastSaved ? (
            <span className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Check size={12} strokeWidth={2.5} aria-hidden="true" /> Saved
            </span>
          ) : null}

          <Button variant="secondary" size="sm" onClick={() => save()} loading={saving}>
            <Save size={13} aria-hidden="true" />
            <span>Save draft</span>
          </Button>
        </div>
      </div>

      {/* Step Pills */}
      <ol className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-surface p-1.5 shadow-2xs">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const done = index < step;
          const active = index === step;
          return (
            <li key={item.id} className="flex-1 min-w-[100px]">
              <button
                type="button"
                onClick={() => index <= step && setStep(index)}
                disabled={index > step}
                aria-current={active ? 'step' : undefined}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-semibold tracking-tight transition-all ${
                  active
                    ? 'bg-accent text-white shadow-xs'
                    : done
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                {done ? <Check size={12} strokeWidth={2.5} aria-hidden="true" /> : <Icon size={13} aria-hidden="true" />}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Main Content Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="card p-5 sm:p-6 bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
            <h2 className="flex items-center gap-2.5 text-base font-bold text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <StepIcon size={15} aria-hidden="true" />
              </span>
              <span>{STEPS[step].label} Information</span>
            </h2>
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {fieldWarning ? (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
              <span>{fieldWarning}</span>
            </div>
          ) : null}

          <div>
            {step === 0 ? <ProfileSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 1 ? <SkillsSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 2 ? <EducationSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 3 ? <ProjectsSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 4 ? <ExperienceSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 5 ? (
              <div className="space-y-6">
                <DesignSection draft={draft} setDraft={updateDraft} showPreview={false} />
                <div className="border-t border-line pt-5">
                  <h3 className="mb-2.5 text-sm font-semibold text-ink">Section Visibility & Reordering</h3>
                  <SectionsSection draft={draft} setDraft={updateDraft} />
                </div>
              </div>
            ) : null}
            {step === 6 ? (
              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-muted">
                  Review your portfolio layout below. You can update any field anytime from the visual editor.
                </p>
                <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                  <TemplatePreviewFrame designWidth={1000} designHeight={980} label="Your portfolio preview">
                    <PortfolioRenderer portfolio={draft} />
                  </TemplatePreviewFrame>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-slate-50/60 p-3.5">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Portfolio Title</p>
                    <TextInput
                      className="mt-1.5"
                      value={draft.title}
                      onChange={(event) => updateDraft({ ...draft, title: event.target.value })}
                      maxLength={120}
                      aria-label="Portfolio title"
                    />
                    <p className="mt-1 text-2xs text-slate-400">Private label shown on your personal dashboard.</p>
                  </div>
                  <div className="rounded-xl border border-line bg-slate-50/60 p-3.5">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Selected Template</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{getTemplate(draft.templateId).name}</p>
                    <p className="mt-1 text-2xs text-slate-400">Can be switched anytime without losing data.</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Navigation Controls */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={goBack} disabled={step === 0}>
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back</span>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {step === STEPS.length - 1 ? (
                <>
                  <Link to="/dashboard" className="btn-ghost btn-sm text-xs font-semibold">
                    Dashboard
                  </Link>
                  <Button variant="secondary" size="sm" onClick={() => save()} loading={saving}>
                    <Save size={13} aria-hidden="true" />
                    <span>Save Draft</span>
                  </Button>
                  <Button variant="secondary" size="sm" onClick={finishToEditor}>
                    <span>Continue in Editor</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Button>
                  <Button variant="primary" size="sm" onClick={publish} loading={publishing}>
                    <Send size={13} aria-hidden="true" />
                    <span>Publish Now</span>
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={goNext} loading={saving}>
                  <span>Continue</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[76px] overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line bg-slate-50/80 px-3.5 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Preview</p>
              </div>
              <span className="badge-draft text-2xs">{getTemplate(draft.templateId).name}</span>
            </div>
            <TemplatePreviewFrame designWidth={900} designHeight={900} label="Live preview of your portfolio">
              <PortfolioRenderer portfolio={draft} />
            </TemplatePreviewFrame>
            <div className="border-t border-line bg-slate-50/50 px-3.5 py-2 text-2xs text-slate-500 flex justify-between items-center">
              <span>{draft.projects.length} project{draft.projects.length === 1 ? '' : 's'}</span>
              <span>{draft.skills.length} skill{draft.skills.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
