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
  { id: 'design', label: 'Design' },
  { id: 'sections', label: 'Sections' },
];

const CONTENT_BLOCKS = [
  { id: 'profile', label: 'Profile', Component: ProfileSection },
  { id: 'skills', label: 'Skills', Component: SkillsSection },
  { id: 'education', label: 'Education', Component: EducationSection },
  { id: 'projects', label: 'Projects', Component: ProjectsSection },
  { id: 'experience', label: 'Experience & achievements', Component: ExperienceSection },
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
    return `${filled} of 6 core areas filled in`;
  }, [draft]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading portfolio…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="text-xl">Portfolio not found</h1>
        <p className="mt-2 text-sm text-inkSoft">
          This portfolio does not exist, or it belongs to another account. Portfolios are private to their owner.
        </p>
        <Link to="/dashboard" className="btn-primary mt-4">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert tone="error" title="Could not load this portfolio">
        {loadError}
        <div className="mt-2">
          <Button variant="secondary" onClick={load}>
            Try again
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <button type="button" onClick={leaveToDashboard} className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink">
            <ArrowLeft size={12} aria-hidden="true" /> Back to portfolios
          </button>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <TextInput
              value={draft.title}
              onChange={(event) => updateDraft({ ...draft, title: event.target.value })}
              maxLength={120}
              aria-label="Portfolio title"
              className="w-full max-w-xs !py-1 text-base font-medium"
            />
            <span className={portfolio.published ? 'badge-published' : 'badge-draft'}>
              {portfolio.published ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {getTemplate(draft.templateId).name} · {progressHint} ·{' '}
            {dirty ? (
              <span className="text-warning">unsaved changes</span>
            ) : lastSaved ? (
              <span className="text-success">saved {formatRelative(lastSaved)}</span>
            ) : (
              `updated ${formatRelative(portfolio.updatedAt)}`
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
                className="btn-ghost px-2 py-1 text-xs"
              >
                <ExternalLink size={13} aria-hidden="true" /> Public page
              </a>
              <Button variant="ghost" size="sm" onClick={copyLink}>
                <Copy size={13} aria-hidden="true" /> Copy link
              </Button>
            </>
          ) : null}
          <Link to={`/dashboard/portfolio/${id}/analyze`} className="btn-ghost px-2.5 py-1 text-xs">
            <Gauge size={13} aria-hidden="true" /> Analyze
          </Link>
          {dirty ? (
            <Button variant="ghost" size="sm" onClick={revert}>
              <RotateCcw size={13} aria-hidden="true" /> Revert
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye size={13} aria-hidden="true" /> Preview
          </Button>
          <Button variant="secondary" size="sm" onClick={() => save()} loading={saving} disabled={!dirty && !saving}>
            <Save size={13} aria-hidden="true" /> {dirty ? 'Save changes' : 'Saved'}
          </Button>
          <Button size="sm" onClick={togglePublish} loading={publishing}>
            {portfolio.published ? <Globe size={13} aria-hidden="true" /> : <Send size={13} aria-hidden="true" />}
            {portfolio.published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {dirty ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
          <AlertCircle size={12} aria-hidden="true" /> Unsaved changes — use “Save changes” to store them in the database.
        </p>
      ) : null}

      {/* Mobile view switch */}
      <div className="mt-3 flex lg:hidden">
        <div className="flex w-full rounded border border-lineStrong bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setMobileView('edit')}
            aria-pressed={mobileView === 'edit'}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-xs ${
              mobileView === 'edit' ? 'bg-canvasAlt font-medium text-ink' : 'text-muted'
            }`}
          >
            <Pencil size={13} aria-hidden="true" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileView('preview')}
            aria-pressed={mobileView === 'preview'}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-xs ${
              mobileView === 'preview' ? 'bg-canvasAlt font-medium text-ink' : 'text-muted'
            }`}
          >
            <Eye size={13} aria-hidden="true" /> Preview
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* Editing pane */}
        <div className={`${mobileView === 'edit' ? 'block' : 'hidden'} lg:block`}>
          <div className="flex border-b border-line" role="tablist" aria-label="Editor panels">
            {TABS.map((item) => (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                  tab === item.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="card mt-3 p-4">
            {tab === 'content' ? (
              <div className="space-y-3">
                {CONTENT_BLOCKS.map((block) => {
                  const open = openBlock === block.id;
                  const Component = block.Component;
                  return (
                    <section key={block.id} className="rounded border border-line">
                      <h2>
                        <button
                          type="button"
                          onClick={() => setOpenBlock(open ? '' : block.id)}
                          aria-expanded={open}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-canvasAlt/60"
                        >
                          {block.label}
                          <span className="text-xs text-muted">{open ? 'Hide' : 'Edit'}</span>
                        </button>
                      </h2>
                      {open ? (
                        <div className="border-t border-line px-3 py-3">
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
          <div className="lg:sticky lg:top-[72px]">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
              <p className="text-2xs uppercase tracking-widest text-muted">Live preview</p>
              <div className="flex items-center gap-1.5">
                <span className="text-2xs text-muted">{getTemplate(draft.templateId).name}</span>
                <div className="flex items-center gap-0.5 rounded border border-lineStrong bg-surface p-0.5">
                  <button
                    type="button"
                    onClick={() => setDevice('desktop')}
                    aria-pressed={device === 'desktop'}
                    aria-label="Desktop preview"
                    className={`rounded-sm p-1 ${device === 'desktop' ? 'bg-canvasAlt text-ink' : 'text-muted'}`}
                  >
                    <Monitor size={13} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice('mobile')}
                    aria-pressed={device === 'mobile'}
                    aria-label="Mobile preview"
                    className={`rounded-sm p-1 ${device === 'mobile' ? 'bg-canvasAlt text-ink' : 'text-muted'}`}
                  >
                    <Smartphone size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <div className={`mt-2 overflow-hidden rounded border border-line bg-white ${device === 'mobile' ? 'mx-auto max-w-[380px]' : ''}`}>
              <TemplatePreviewFrame
                designWidth={device === 'mobile' ? 390 : 1000}
                designHeight={device === 'mobile' ? 1500 : 1400}
                label="Live portfolio preview"
              >
                <PortfolioRenderer portfolio={draft} />
              </TemplatePreviewFrame>
            </div>
            <p className="mt-2 text-2xs text-muted">
              Preview updates instantly. Saved content is what visitors see on the public page.
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview — ${draft.title}`}
        description={portfolio.published ? 'This is what visitors see at your public link.' : 'Draft preview. Publish to make it public.'}
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
        <div className="overflow-hidden rounded border border-line bg-white">
          <TemplatePreviewFrame designWidth={1050} designHeight={1300} label="Full portfolio preview">
            <PortfolioRenderer portfolio={draft} />
          </TemplatePreviewFrame>
        </div>
        {dirty ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
            <AlertCircle size={12} aria-hidden="true" /> This preview includes unsaved edits. Save before publishing.
          </p>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
            <Check size={12} aria-hidden="true" /> Preview matches the saved version.
          </p>
        )}
      </Modal>
    </div>
  );
}
