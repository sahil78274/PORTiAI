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
import { getTemplate, TEMPLATES } from '../utils/templates.js';

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
      try {
        if (storedId) {
          try {
            const data = await portfolioService.get(storedId);
            setPortfolioId(data.portfolio.id);
            setDraft(draftFromPortfolio(data.portfolio));
            return;
          } catch {
            sessionStorage.removeItem(STORAGE_KEY);
          }
        }

        const created = await portfolioService.create(
          templateParam && TEMPLATES.some((template) => template.id === templateParam)
            ? { templateId: templateParam }
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
      setFieldWarning('Add your full name before continuing — it is the one field every template needs.');
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
      toast.success('Portfolio published.', { description: 'Your public link is ready.' });
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
  const progress = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Preparing your new portfolio…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger/25 bg-dangerSoft p-6">
        <p className="flex items-center gap-2 text-sm font-medium text-danger">
          <AlertCircle size={16} aria-hidden="true" /> {error}
        </p>
        <Button variant="secondary" className="mt-3" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">New portfolio</p>
          <h1 className="mt-1 text-2xl">Build your portfolio</h1>
          <p className="mt-1 text-sm text-muted">
            Step {step + 1} of {STEPS.length} · {STEPS[step].label}. Your progress is saved to your account when you
            continue.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" /> Unsaved changes
            </span>
          ) : lastSaved ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Check size={12} aria-hidden="true" /> Saved
            </span>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => save()} loading={saving}>
            <Save size={13} aria-hidden="true" /> Save draft
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={step + 1} max={STEPS.length} label={`Step ${step + 1} of ${STEPS.length}`} />
      </div>

      <ol className="mt-4 flex flex-wrap gap-1.5">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const done = index < step;
          const active = index === step;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => index <= step && setStep(index)}
                disabled={index > step}
                aria-current={active ? 'step' : undefined}
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors ${
                  active
                    ? 'border-accent bg-accent-soft font-medium text-accent'
                    : done
                      ? 'border-line bg-surface text-inkSoft hover:border-lineStrong'
                      : 'border-line bg-canvasAlt/50 text-faint'
                }`}
              >
                {done ? <Check size={12} aria-hidden="true" /> : <Icon size={12} aria-hidden="true" />}
                {item.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="card p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-lg">
            <StepIcon size={17} className="text-accent" aria-hidden="true" />
            {STEPS[step].label}
          </h2>

          {fieldWarning ? (
            <p role="alert" className="mt-2 flex items-start gap-1.5 rounded border border-warning/25 bg-warningSoft px-3 py-2 text-xs text-warning">
              <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {fieldWarning}
            </p>
          ) : null}

          <div className="mt-4">
            {step === 0 ? <ProfileSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 1 ? <SkillsSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 2 ? <EducationSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 3 ? <ProjectsSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 4 ? <ExperienceSection draft={draft} setDraft={updateDraft} /> : null}
            {step === 5 ? (
              <div className="space-y-6">
                <DesignSection draft={draft} setDraft={updateDraft} showPreview={false} />
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-ink">Visible sections</h3>
                  <SectionsSection draft={draft} setDraft={updateDraft} />
                </div>
              </div>
            ) : null}
            {step === 6 ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-inkSoft">
                  Review the layout below. You can change any detail later — the editor has all the same fields plus a
                  live preview.
                </p>
                <div className="rounded border border-line">
                  <TemplatePreviewFrame designWidth={1000} designHeight={980} label="Your portfolio preview">
                    <PortfolioRenderer portfolio={draft} />
                  </TemplatePreviewFrame>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded border border-line bg-surface p-3">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-muted">Portfolio title</p>
                    <TextInput
                      className="mt-1.5"
                      value={draft.title}
                      onChange={(event) => updateDraft({ ...draft, title: event.target.value })}
                      maxLength={120}
                      aria-label="Portfolio title"
                    />
                    <p className="mt-1 text-2xs text-muted">Shown on your dashboard, not on the public page.</p>
                  </div>
                  <div className="rounded border border-line bg-surface p-3">
                    <p className="text-2xs font-semibold uppercase tracking-widest text-muted">Template</p>
                    <p className="mt-1 text-sm text-ink">{getTemplate(draft.templateId).name}</p>
                    <p className="mt-1 text-2xs text-muted">Change it in the editor without losing content.</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={goBack} disabled={step === 0}>
              <ArrowLeft size={14} aria-hidden="true" /> Back
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              {step === STEPS.length - 1 ? (
                <>
                  <Link to="/dashboard" className="btn-ghost">
                    Exit to dashboard
                  </Link>
                  <Button variant="secondary" onClick={() => save()} loading={saving}>
                    <Save size={14} aria-hidden="true" /> Save as draft
                  </Button>
                  <Button variant="secondary" onClick={finishToEditor}>
                    Continue editing <ArrowRight size={14} aria-hidden="true" />
                  </Button>
                  <Button onClick={publish} loading={publishing}>
                    <Send size={14} aria-hidden="true" /> Publish
                  </Button>
                </>
              ) : (
                <Button onClick={goNext} loading={saving}>
                  Continue <ArrowRight size={14} aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="card sticky top-[72px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-line bg-canvasAlt/60 px-3 py-2">
              <p className="text-2xs uppercase tracking-widest text-muted">Live preview</p>
              <span className="text-2xs text-muted">{getTemplate(draft.templateId).name}</span>
            </div>
            <TemplatePreviewFrame designWidth={900} designHeight={900} label="Live preview of your portfolio">
              <PortfolioRenderer portfolio={draft} />
            </TemplatePreviewFrame>
            <p className="border-t border-line px-3 py-2 text-2xs text-muted">
              Updates as you type. {draft.projects.length} project{draft.projects.length === 1 ? '' : 's'} ·{' '}
              {draft.skills.length} skill{draft.skills.length === 1 ? '' : 's'}
            </p>
          </div>
        </aside>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted lg:hidden">
        <Loader2 size={12} aria-hidden="true" className="animate-spin" style={{ animationDuration: '3s' }} />
        Tip: the full live preview is available in the editor on larger screens.
      </p>
    </div>
  );
}
