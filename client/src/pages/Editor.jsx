import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Check,
  Cloud,
  CloudOff,
  Eye,
  ExternalLink,
  Gauge,
  Layers,
  LayoutList,
  Loader2,
  Monitor,
  Newspaper,
  Palette,
  Rocket,
  Save,
  Smartphone,
  Tablet,
  UserRound,
  Wrench,
} from 'lucide-react';
import { Alert, Button, Spinner, Switch, TextArea, TextInput } from '../components/ui/Primitives.jsx';
import Modal from '../components/ui/Modal.jsx';
import PortfolioRenderer from '../templates/PortfolioRenderer.jsx';
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
  { id: 'profile', label: 'Basic Information', short: 'Profile', icon: UserRound },
  { id: 'skills', label: 'Skills', short: 'Skills', icon: Wrench },
  { id: 'projects', label: 'Projects', short: 'Projects', icon: LayoutList },
  { id: 'experience', label: 'Experience & Education', short: 'Experience', icon: Briefcase },
  { id: 'design', label: 'Appearance', short: 'Design', icon: Palette },
  { id: 'sections', label: 'Section order', short: 'Sections', icon: Layers },
  { id: 'blog', label: 'Blog', short: 'Blog', icon: Newspaper },
];

const DEVICES = [
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: '834px' },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: '430px' },
];

function BlogSettings({ draft, setDraft }) {
  const enabled = Boolean(draft.blog?.enabled);
  return (
    <div className="space-y-5">
      <div className="neu-inset-sm p-4">
        <Switch
          checked={enabled}
          onChange={(value) => setDraft({ ...draft, blog: { ...draft.blog, enabled: value } })}
          label="Enable a public blog on this portfolio"
          description="Adds a blog link and listing page to your public portfolio. Only published posts are visible to visitors."
        />
      </div>

      <div className={enabled ? 'space-y-4' : 'space-y-4 opacity-50'}>
        <div>
          <label htmlFor="blog-title" className="label">
            Blog title
          </label>
          <TextInput
            id="blog-title"
            value={draft.blog?.title || ''}
            maxLength={120}
            disabled={!enabled}
            placeholder={`${draft.profile?.fullName || 'Your name'} — Blog`}
            onChange={(event) => setDraft({ ...draft, blog: { ...draft.blog, title: event.target.value } })}
          />
        </div>
        <div>
          <label htmlFor="blog-intro" className="label">
            Short introduction
          </label>
          <TextArea
            id="blog-intro"
            value={draft.blog?.intro || ''}
            maxLength={600}
            rows={4}
            disabled={!enabled}
            placeholder="What do you write about? One or two sentences for the top of your blog page."
            onChange={(event) => setDraft({ ...draft, blog: { ...draft.blog, intro: event.target.value } })}
          />
          <p className="hint">{(draft.blog?.intro || '').length}/600 characters</p>
        </div>
      </div>

      <div className="card p-4">
        <p className="text-sm font-medium text-ink">Writing posts</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Posts live in the Blog studio: draft in Markdown, use AI writing help, and publish when ready. Publishing a
          post automatically turns this blog page on.
        </p>
        <Link to="/dashboard/blog" className="btn-secondary btn-sm mt-3">
          <Newspaper size={13} aria-hidden="true" />
          Open blog studio
        </Link>
      </div>

      {enabled && draft.blog?.enabled ? (
        <p className="text-[11px] leading-relaxed text-faint">
          Remember to save your changes. The blog page appears at the public URL once both this portfolio and at least
          one post are published.
        </p>
      ) : null}
    </div>
  );
}

export default function Editor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
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
  // `/edit?tab=design` deep-links straight to a tab (used by "Customize" in the gallery).
  const [tab, setTab] = useState(() => {
    const requested = searchParams.get('tab');
    return TABS.some((item) => item.id === requested) ? requested : 'profile';
  });
  const [device, setDevice] = useState('desktop');
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveState, setAutoSaveState] = useState('idle');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState('edit');

  const dirty = draft ? JSON.stringify(draftToPayload(draft)) !== savedSnapshot : false;
  useUnsavedWarning(dirty);

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

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

  const save = useCallback(
    async ({ quiet = false } = {}) => {
      if (!draft) return false;
      setSaving(true);
      try {
        const data = await portfolioService.update(id, draftToPayload(draft));
        const refreshed = draftFromPortfolio(data.portfolio);
        setPortfolio(data.portfolio);
        setSavedSnapshot(JSON.stringify(draftToPayload(refreshed)));
        setLastSaved(new Date());
        setAutoSaveState('saved');
        if (!quiet) toast.success('Draft saved.');
        return true;
      } catch (error) {
        setAutoSaveState('error');
        toast.error(error.message || 'Could not save your changes.');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [draft, id, toast]
  );

  // Debounced autosave: only fires when the draft is dirty and the user pauses.
  useEffect(() => {
    if (!dirty || saving) return undefined;
    setAutoSaveState('pending');
    const timer = setTimeout(() => {
      if (dirtyRef.current) save({ quiet: true });
    }, 2600);
    return () => clearTimeout(timer);
  }, [draft, dirty, saving, save]);

  const publish = async () => {
    if (!draft) return;
    setPublishing(true);
    try {
      if (dirty) {
        const saved = await save({ quiet: true });
        if (!saved) throw new Error('Save your changes before publishing.');
      }
      const data = await portfolioService.setPublished(id, true);
      setPortfolio(data.portfolio);
      toast.success('Portfolio published.');
      navigate(`/dashboard/publish/${id}`);
    } catch (error) {
      toast.error(error.message || 'Could not publish this portfolio.');
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    setPublishing(true);
    try {
      const data = await portfolioService.setPublished(id, false);
      setPortfolio(data.portfolio);
      toast.info('Portfolio set back to draft. The public link no longer resolves.');
    } catch (error) {
      toast.error(error.message || 'Could not change the publishing state.');
    } finally {
      setPublishing(false);
    }
  };

  const progress = useMemo(() => {
    if (!draft) return { filled: 0, total: 6 };
    const checks = [
      draft.profile.fullName,
      draft.profile.summary || draft.profile.bio,
      draft.skills.length,
      draft.education.length,
      draft.projects.length,
      draft.experience.length || draft.achievements.length,
    ];
    return { filled: checks.filter(Boolean).length, total: checks.length };
  }, [draft]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading your portfolio…" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-[18px] font-semibold text-ink">Portfolio not found</h1>
        <p className="mt-2 text-sm text-muted">This portfolio does not exist, or it belongs to another account.</p>
        <Link to="/dashboard/portfolios" className="btn-primary mt-5">
          Back to my portfolios
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <Alert tone="error" title="Could not load this portfolio" actions={<Button variant="secondary" size="sm" onClick={load}>Try again</Button>}>
        {loadError}
      </Alert>
    );
  }

  const template = getTemplate(draft.templateId);
  const publicUrl = portfolio.slug ? `${window.location.origin}/p/${portfolio.slug}` : '';
  const preview = <PortfolioRenderer portfolio={draft} blogHref={draft.blog?.enabled && portfolio.slug ? `/p/${portfolio.slug}/blog` : undefined} />;

  const Status = () => {
    if (autoSaveState === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-danger">
          <CloudOff size={12} aria-hidden="true" />
          Save failed — retry
        </span>
      );
    }
    if (saving || autoSaveState === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          {saving ? 'Saving…' : 'Unsaved changes'}
        </span>
      );
    }
    if (dirty) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-warning">
          <Cloud size={12} aria-hidden="true" />
          Unsaved changes
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-success">
        <Check size={12} aria-hidden="true" />
        {lastSaved ? `Saved ${formatRelative(lastSaved)}` : 'All changes saved'}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-16 xl:pb-0">
      {/* Toolbar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/dashboard/portfolios" className="icon-btn" aria-label="Back to portfolios">
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <input
              type="text"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              maxLength={120}
              aria-label="Portfolio title"
              className="w-full max-w-xs truncate rounded-[10px] border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-semibold text-ink transition-[box-shadow,background-color] hover:shadow-neu-inset-xs focus:bg-canvas focus:shadow-neu-inset-sm focus:outline-none sm:max-w-sm sm:text-base"
            />
            <div className="mt-1 flex flex-wrap items-center gap-2 px-1.5 text-[11px] text-faint">
              <span className={portfolio.published ? 'badge-published !py-0' : 'badge-draft !py-0'}>
                {portfolio.published ? 'Published' : 'Draft'}
              </span>
              <span>{template.name}</span>
              <span aria-hidden="true">·</span>
              <span>{progress.filled}/{progress.total} core sections</span>
              <Status />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/portfolio/${id}/analyze`} className="btn-ghost btn-sm">
            <Gauge size={13} aria-hidden="true" />
            <span className="hidden sm:inline">Analyze</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye size={13} aria-hidden="true" />
            <span className="hidden sm:inline">Full preview</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => save()} loading={saving} disabled={!dirty}>
            <Save size={13} aria-hidden="true" />
            Save draft
          </Button>
          {portfolio.published ? (
            <>
              <a href={`/p/${portfolio.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm">
                <ExternalLink size={13} aria-hidden="true" />
                <span className="hidden sm:inline">View site</span>
              </a>
              <Button variant="ghost" size="sm" onClick={unpublish} disabled={publishing}>
                Unpublish
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={publish} loading={publishing}>
              <Rocket size={13} aria-hidden="true" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,620px)_minmax(0,1fr)]">
        {/* Editing panel */}
        <section className={`card overflow-hidden ${mobilePane === 'preview' ? 'hidden xl:block' : ''}`} aria-label="Portfolio editor">
          <div className="sm:flex">
            {/* Vertical rail on wider screens, matching a two-panel editor. */}
            <nav
              className="hidden w-[176px] shrink-0 flex-col gap-1.5 border-r border-line p-3 sm:flex xl:hidden 2xl:flex"
              aria-label="Editor sections"
            >
              {TABS.map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  type="button"
                  aria-current={tab === tabId ? 'true' : undefined}
                  onClick={() => setTab(tabId)}
                  className={`sidebar-link px-3 py-2 text-left text-[12.5px] ${tab === tabId ? 'sidebar-link-active' : ''}`}
                >
                  <Icon size={13} className="shrink-0" aria-hidden="true" />
                  <span className="leading-4">{label}</span>
                </button>
              ))}
            </nav>

            <div className="min-w-0 flex-1">
              <div className="px-3 pt-3 sm:hidden xl:block 2xl:hidden">
              <div className="segmented flex w-full overflow-x-auto scrollbar-none" role="tablist" aria-label="Editor sections">
                {TABS.map(({ id: tabId, short, icon: Icon }) => (
                  <button
                    key={tabId}
                    role="tab"
                    type="button"
                    aria-selected={tab === tabId}
                    onClick={() => setTab(tabId)}
                    className={`segmented-item shrink-0 text-[11.5px] ${tab === tabId ? 'segmented-item-active font-semibold' : ''}`}
                  >
                    <Icon size={12} aria-hidden="true" />
                    {short}
                  </button>
                ))}
              </div>
              </div>

              <div className="max-h-[calc(100vh-240px)] overflow-y-auto p-5 scroll-slim">
            {tab === 'profile' ? <ProfileSection draft={draft} setDraft={setDraft} /> : null}
            {tab === 'skills' ? <SkillsSection draft={draft} setDraft={setDraft} /> : null}
            {tab === 'projects' ? <ProjectsSection draft={draft} setDraft={setDraft} /> : null}
            {tab === 'experience' ? (
              <div className="space-y-8">
                <ExperienceSection draft={draft} setDraft={setDraft} />
                <EducationSection draft={draft} setDraft={setDraft} />
              </div>
            ) : null}
            {tab === 'design' ? <DesignSection draft={draft} setDraft={setDraft} showPreview={false} /> : null}
            {tab === 'sections' ? <SectionsSection draft={draft} setDraft={setDraft} /> : null}
                {tab === 'blog' ? <BlogSettings draft={draft} setDraft={setDraft} /> : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
            <Status />
            <p className="text-[10px] text-faint">Autosaves after a pause</p>
          </div>
        </section>

        {/* Preview panel */}
        <section className={`card overflow-hidden ${mobilePane === 'edit' ? 'hidden xl:block' : ''}`} aria-label="Live preview">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="icon-tile-sm">
                <Eye size={13} aria-hidden="true" />
              </span>
              <p className="text-[13px] font-semibold text-ink">Live preview</p>
              <span className="hidden text-[10px] text-faint sm:inline">Updates instantly</span>
            </div>
            <div className="segmented" role="group" aria-label="Preview device">
              {DEVICES.map(({ id: deviceId, label, icon: Icon }) => (
                <button
                  key={deviceId}
                  type="button"
                  onClick={() => setDevice(deviceId)}
                  aria-pressed={device === deviceId}
                  aria-label={`${label} preview`}
                  title={label}
                  className={`segmented-item px-2 py-1.5 ${device === deviceId ? 'segmented-item-active' : ''}`}
                >
                  <Icon size={13} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <div className="mx-3 mb-3 rounded-[16px] bg-canvas p-2 shadow-neu-inset-sm sm:p-3">
            <div className="mx-auto overflow-hidden rounded-[10px] bg-white shadow-neu-xs transition-colors duration-300" style={{ maxWidth: DEVICES.find((item) => item.id === device).width }}>
              <div className="h-[calc(100vh-260px)] min-h-[560px] overflow-y-auto scroll-slim">{preview}</div>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile pane switch */}
      <div className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-center gap-1 rounded-[18px] bg-surface p-1.5 shadow-neu-lg xl:hidden">
        {[
          { id: 'edit', label: 'Editor', icon: LayoutList },
          { id: 'preview', label: 'Preview', icon: Eye },
        ].map(({ id: paneId, label, icon: Icon }) => (
          <button
            key={paneId}
            type="button"
            onClick={() => setMobilePane(paneId)}
            aria-pressed={mobilePane === paneId}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-xs font-semibold transition-[box-shadow,color] ${
              mobilePane === paneId ? 'bg-canvas text-accent-hover shadow-neu-inset-sm' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview — ${draft.title}`}
        description="Rendered from the current unsaved draft. Nothing is published until you press Publish."
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {portfolio.published && portfolio.slug ? (
              <a href={`/p/${portfolio.slug}`} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <ExternalLink size={14} aria-hidden="true" />
                Open public site
              </a>
            ) : (
              <Button onClick={publish} loading={publishing}>
                <Rocket size={14} aria-hidden="true" />
                Publish portfolio
              </Button>
            )}
          </>
        }
      >
        <div className="rounded-[18px] bg-canvas p-2 shadow-neu-inset-sm">
          <div className="h-[65vh] overflow-y-auto rounded-[12px] bg-white shadow-neu-xs scroll-slim">{preview}</div>
        </div>
        {portfolio.published && publicUrl ? <p className="mt-3 truncate text-xs text-muted">{publicUrl}</p> : null}
      </Modal>

      {dirty ? (
        <div className="flex items-center gap-2 rounded-tile bg-warningSoft shadow-neu-inset-xs px-3.5 py-2 text-[11px] text-warning">
          <AlertCircle size={13} aria-hidden="true" />
          You have unsaved changes. Autosave will save them shortly, or press Save draft now.
        </div>
      ) : null}
    </div>
  );
}
