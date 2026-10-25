import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Pencil,
  Monitor,
  Smartphone,
  Copy,
  Gauge,
  Check,
  AlertCircle,
  Globe,
  ExternalLink,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button, TextInput, Spinner, Alert } from '../components/ui/Primitives.jsx';
import Modal from '../components/ui/Modal.jsx';
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
import { draftFromPortfolio, draftToPayload } from '../utils/portfolioDraft.js';
import { portfolioService } from '../services/portfolioService.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatRelative } from '../utils/format.js';
import { getTemplate } from '../utils/templates.js';

const TABS = [
  { id: 'content', label: 'Content' },
  { id: 'design', label: 'Design & Theme' },
  { id: 'sections', label: 'Order & Visibility' },
];

const CONTENT_BLOCKS = [
  { id: 'profile', label: 'Profile & Bio', Component: ProfileSection },
  { id: 'skills', label: 'Technical Skills', Component: SkillsSection },
  { id: 'education', label: 'Education History', Component: EducationSection },
  { id: 'projects', label: 'Portfolio Projects', Component: ProjectsSection },
  { id: 'experience', label: 'Experience & Achievements', Component: ExperienceSection },
];

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [portfolio, setPortfolio] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tab, setTab] = useState('content');
  const [device, setDevice] = useState('desktop');
  const [mobileView, setMobileView] = useState('edit');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [openBlock, setOpenBlock] = useState('profile');

  const serialise = (value) => (value ? JSON.stringify(draftToPayload(value)) : '');
  const dirty = draft ? serialise(draft) !== savedSnapshot : false;

  useUnsavedWarning(dirty);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await portfolioService.get(id);
      const nextDraft = draftFromPortfolio(data.portfolio);
      setPortfolio(data.portfolio);
      setDraft(nextDraft);
      setSavedSnapshot(JSON.stringify(draftToPayload(nextDraft)));
    } catch (error) {
      if (error.status === 404) setNotFound(true);
      else setLoadError(error.message || 'Could not load this portfolio.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDraft = useCallback((next) => setDraft(next), []);

  const save = useCallback(
    async ({ quiet = false } = {}) => {
      if (!draft) return false;
      setSaving(true);
      try {
        const data = await portfolioService.update(id, draftToPayload(draft));
        const refreshed = draftFromPortfolio(data.portfolio);
        setPortfolio(data.portfolio);
        setDraft(refreshed);
        setSavedSnapshot(JSON.stringify(draftToPayload(refreshed)));
        setLastSaved(new Date());
        if (!quiet) toast.success('Changes saved.');
        return true;
      } catch (error) {
        toast.error(error.message || 'Could not save your changes.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [draft, id, toast]
  );

  const revert = () => {
    if (!portfolio) return;
    const restored = draftFromPortfolio(portfolio);
    setDraft(restored);
    toast.info('Reverted to the last saved version.');
  };

  const togglePublish = async () => {
    setPublishing(true);
    try {
      if (dirty) {
        const saved = await save({ quiet: true });
        if (!saved) throw new Error('Save your changes before publishing.');
      }
      const data = await portfolioService.setPublished(id, !portfolio.published);
      setPortfolio(data.portfolio);
      toast.success(data.portfolio.published ? 'Portfolio is now public.' : 'Portfolio is now a private draft.');
      if (data.portfolio.published) setPreviewOpen(false);
    } catch (error) {
      toast.error(error.message || 'Could not change the publishing state.');
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = async () => {
    if (!portfolio?.slug) return;
    const url = `${window.location.origin}/p/${portfolio.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public link copied.');
    } catch {
      toast.info('Copy this link manually:', { description: url, duration: 9000 });
    }
  };

  const leaveToDashboard = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    navigate('/dashboard');
  };

  const progressHint = useMemo(() => {
    if (!draft) return '';
    const filled = [
      draft.profile.fullName,
      draft.profile.summary || draft.profile.bio,
      draft.skills.length,
      draft.education.length,
      draft.projects.length,
      draft.experience.length || draft.achievements.length,
    ].filter(Boolean).length;
    return `${filled} of 6 core sections complete`;
  }, [draft]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading portfolio editor…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center bg-surface shadow-card">
        <h1 className="text-xl font-bold text-ink">Portfolio not found</h1>
        <p className="mt-2 text-xs text-muted">
          This portfolio does not exist, or it belongs to another account.
        </p>
        <Link to="/dashboard" className="btn-primary mt-5">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert tone="error" title="Could not load this portfolio">
        {loadError}
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="min-w-0">
          <button
            type="button"
            onClick={leaveToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink transition-colors"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            <span>Portfolios</span>
          </button>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={draft.title}
              onChange={(event) => updateDraft({ ...draft, title: event.target.value })}
              maxLength={120}
              aria-label="Portfolio title"
              className="rounded-lg border border-transparent px-2 py-0.5 text-lg font-bold tracking-tight text-ink hover:border-line focus:border-accent focus:bg-white focus:outline-none transition-all max-w-sm sm:max-w-md"
            />
            <span className={portfolio.published ? 'badge-published' : 'badge-draft'}>
              {portfolio.published ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="mt-1 text-2xs text-muted pl-2">
            <span className="font-semibold text-slate-700">{getTemplate(draft.templateId).name}</span> · {progressHint} ·{' '}
            {dirty ? (
              <span className="font-semibold text-amber-600">● Unsaved changes</span>
            ) : lastSaved ? (
              <span className="font-medium text-emerald-600">Saved {formatRelative(lastSaved)}</span>
            ) : (
              `Updated ${formatRelative(portfolio.updatedAt)}`
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {portfolio.published && portfolio.slug ? (
            <>
              <a
                href={`/p/${portfolio.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-sm text-xs font-semibold"
              >
                <ExternalLink size={13} aria-hidden="true" />
                <span>Public page</span>
              </a>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                <Copy size={13} aria-hidden="true" />
                <span>Copy link</span>
              </Button>
            </>
          ) : null}

          <Link to={`/dashboard/portfolio/${id}/analyze`} className="btn-ghost btn-sm text-xs font-semibold">
            <Gauge size={13} aria-hidden="true" />
            <span>Analyze</span>
          </Link>

          {dirty ? (
            <Button variant="ghost" size="sm" onClick={revert}>
              <RotateCcw size={13} aria-hidden="true" />
              <span>Revert</span>
            </Button>
          ) : null}

          <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye size={13} aria-hidden="true" />
            <span>Full Preview</span>
          </Button>

          <Button
            variant={dirty ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => save()}
            loading={saving}
            disabled={!dirty && !saving}
          >
            <Save size={13} aria-hidden="true" />
            <span>{dirty ? 'Save changes' : 'Saved'}</span>
          </Button>

          <Button
            variant={portfolio.published ? 'secondary' : 'primary'}
            size="sm"
            onClick={togglePublish}
            loading={publishing}
          >
            {portfolio.published ? <Globe size={13} aria-hidden="true" /> : <Send size={13} aria-hidden="true" />}
            <span>{portfolio.published ? 'Unpublish' : 'Publish'}</span>
          </Button>
        </div>
      </div>

      {dirty ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800">
          <AlertCircle size={14} className="shrink-0 text-amber-600" aria-hidden="true" />
          <span>You have unsaved changes. Remember to click &ldquo;Save changes&rdquo; before leaving.</span>
        </div>
      ) : null}

      {/* Mobile view switch */}
      <div className="flex lg:hidden">
        <div className="flex w-full rounded-xl border border-line bg-surface p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileView('edit')}
            aria-pressed={mobileView === 'edit'}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold ${
              mobileView === 'edit' ? 'bg-slate-100 text-ink shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Pencil size={13} aria-hidden="true" />
            <span>Edit Sections</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('preview')}
            aria-pressed={mobileView === 'preview'}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold ${
              mobileView === 'preview' ? 'bg-slate-100 text-ink shadow-2xs' : 'text-slate-500'
            }`}
          >
            <Eye size={13} aria-hidden="true" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left editor / Right preview */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Editing pane */}
        <div className={`${mobileView === 'edit' ? 'block' : 'hidden'} lg:block`}>
          <div className="flex rounded-xl border border-line bg-slate-100/70 p-1 mb-3" role="tablist" aria-label="Editor panels">
            {TABS.map((item) => (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold tracking-tight transition-all ${
                  tab === item.id
                    ? 'bg-white text-ink shadow-2xs'
                    : 'text-slate-500 hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="card p-5 bg-surface shadow-card">
            {tab === 'content' ? (
              <div className="space-y-3">
                {CONTENT_BLOCKS.map((block) => {
                  const open = openBlock === block.id;
                  const Component = block.Component;
                  return (
                    <section
                      key={block.id}
                      className={`rounded-xl border transition-all ${
                        open ? 'border-lineStrong bg-white shadow-xs ring-1 ring-slate-200/50' : 'border-line bg-surface hover:border-lineStrong'
                      }`}
                    >
                      <h2>
                        <button
                          type="button"
                          onClick={() => setOpenBlock(open ? '' : block.id)}
                          aria-expanded={open}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold text-ink"
                        >
                          <span className="flex items-center gap-2">
                            {open ? (
                              <ChevronDown size={14} className="text-accent" aria-hidden="true" />
                            ) : (
                              <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />
                            )}
                            <span className="text-sm font-semibold">{block.label}</span>
                          </span>
                          <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${open ? 'bg-accent-soft text-accent' : 'bg-slate-100 text-slate-500'}`}>
                            {open ? 'Open' : 'Edit'}
                          </span>
                        </button>
                      </h2>
                      {open ? (
                        <div className="border-t border-line px-4 py-4 animate-in fade-in duration-100">
                          <Component draft={draft} setDraft={updateDraft} />
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            ) : null}

            {tab === 'design' ? <DesignSection draft={draft} setDraft={updateDraft} showPreview={false} /> : null}

            {tab === 'sections' ? <SectionsSection draft={draft} setDraft={updateDraft} /> : null}
          </div>
        </div>

        {/* Live preview pane */}
        <div className={`${mobileView === 'preview' ? 'block' : 'hidden'} lg:block`}>
          <div className="lg:sticky lg:top-[76px]">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Live Preview Frame</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge-draft text-2xs">{getTemplate(draft.templateId).name}</span>
                <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDevice('desktop')}
                    aria-pressed={device === 'desktop'}
                    aria-label="Desktop preview"
                    className={`rounded-md p-1 transition-colors ${
                      device === 'desktop' ? 'bg-slate-100 text-ink shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Monitor size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice('mobile')}
                    aria-pressed={device === 'mobile'}
                    aria-label="Mobile preview"
                    className={`rounded-md p-1 transition-colors ${
                      device === 'mobile' ? 'bg-slate-100 text-ink shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Smartphone size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div
              className={`overflow-hidden rounded-2xl border border-line bg-white shadow-raised transition-all duration-300 ${
                device === 'mobile' ? 'mx-auto max-w-[380px]' : ''
              }`}
            >
              <TemplatePreviewFrame
                designWidth={device === 'mobile' ? 390 : 1000}
                designHeight={device === 'mobile' ? 1500 : 1400}
                label="Live portfolio preview"
              >
                <PortfolioRenderer portfolio={draft} />
              </TemplatePreviewFrame>
            </div>
            <p className="mt-2.5 text-center text-2xs text-slate-400">
              Instant hot reload. What you see is rendered identically on the public URL.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview — ${draft.title}`}
        description={
          portfolio.published
            ? 'This matches what visitors see at your public link.'
            : 'Draft preview. Click Publish to make it public.'
        }
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={togglePublish} loading={publishing}>
              {portfolio.published ? 'Unpublish' : 'Publish now'}
            </Button>
          </>
        }
      >
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <TemplatePreviewFrame designWidth={1050} designHeight={1300} label="Full portfolio preview">
            <PortfolioRenderer portfolio={draft} />
          </TemplatePreviewFrame>
        </div>
        {dirty ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
            <AlertCircle size={13} aria-hidden="true" /> This preview includes unsaved edits. Save before publishing.
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
            <Check size={13} aria-hidden="true" /> Preview is synchronized with the saved database record.
          </p>
        )}
      </Modal>
    </div>
  );
}
