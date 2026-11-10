import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FolderOpen,
  FolderTree,
  Info,
  ListChecks,
  Loader2,
  Monitor,
  Plus,
  RefreshCcw,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import Modal from '../ui/Modal.jsx';
import { Button } from '../ui/Primitives.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { aiProjectService, saveBlob } from '../../services/aiProjectService.js';
import AddToPortfolioDialog from './AddToPortfolioDialog.jsx';

const TABS = [
  { id: 'preview', label: 'Preview', Icon: Eye },
  { id: 'code', label: 'Code', Icon: Code2 },
  { id: 'readme', label: 'README', Icon: BookOpen },
  { id: 'setup', label: 'Setup', Icon: ListChecks },
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/** Groups file paths into their folders, preserving a natural order. */
const groupFiles = (files) => {
  const groups = new Map();
  [...files]
    .sort((a, b) => a.path.localeCompare(b.path))
    .forEach((file) => {
      const parts = file.path.split('/');
      const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
      if (!groups.has(folder)) groups.set(folder, []);
      groups.get(folder).push(file);
    });
  return [...groups.entries()].map(([folder, items]) => ({ folder, items }));
};

export default function ProjectWorkspace({
  project,
  issues = [],
  credits,
  onBack,
  onProjectChange,
  onDeleted,
}) {
  const toast = useToast();
  const [tab, setTab] = useState(project?.previewSupported ? 'preview' : 'code');
  const [selectedPath, setSelectedPath] = useState(project?.entryFile || project?.files?.[0]?.path || '');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenMode, setRegenMode] = useState('regenerate');
  const [instruction, setInstruction] = useState('');
  const [regeneratingFile, setRegeneratingFile] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [regenAllOpen, setRegenAllOpen] = useState(false);

  const files = project?.files || [];
  const groups = useMemo(() => groupFiles(files), [files]);

  /*
   * Regenerating the whole project replaces the file list. Reset the selected
   * file to the new entry point so the editor never points at a stale path.
   */
  useEffect(() => {
    setDraft(null);
    setSelectedPath(project?.entryFile || project?.files?.[0]?.path || '');
    if (project?.previewSupported) setTab('preview');
  }, [project?.id, project?.generatedAt, project?.entryFile, project?.previewSupported]);

  const selectedFile = files.find((file) => file.path === selectedPath) || files[0] || null;
  const content = draft ?? selectedFile?.content ?? '';
  const dirty = draft !== null && draft !== (selectedFile?.content ?? '');
  const errorIssues = issues.filter((issue) => issue.severity === 'error');
  const warningIssues = issues.filter((issue) => issue.severity !== 'error');

  const selectFile = (path) => {
    if (dirty && !window.confirm('Discard the unsaved changes to this file?')) return;
    setSelectedPath(path);
    setDraft(null);
  };

  const copy = async (text, label = 'Copied to clipboard.') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
    } catch {
      toast.error('Your browser blocked clipboard access. Select the text and copy it manually.');
    }
  };

  const save = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const data = await aiProjectService.saveFile(project.id, { path: selectedFile.path, content });
      onProjectChange(data.project, data.issues || []);
      setDraft(null);
      toast.success('File saved.', { description: 'Preview updated where the stack supports it.' });
    } catch (err) {
      toast.error(err.message || 'The file could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const regenerateFile = async () => {
    if (!selectedFile) return;
    if (regenMode === 'modify' && instruction.trim().length < 4) {
      toast.error('Describe the change you want first.');
      return;
    }
    setRegeneratingFile(true);
    try {
      const data = await aiProjectService.regenerateFile(project.id, {
        path: selectedFile.path,
        instruction: instruction.trim(),
        mode: regenMode,
      });
      onProjectChange(data.project, data.issues || [], data.credits);
      setDraft(null);
      setRegenOpen(false);
      setInstruction('');
      toast.success(regenMode === 'modify' ? 'File updated by AI.' : 'File regenerated.', {
        description: 'One AI credit was used.',
      });
    } catch (err) {
      toast.error(err.message || 'The file could not be regenerated.');
    } finally {
      setRegeneratingFile(false);
    }
  };

  const regenerateAll = async () => {
    setRegeneratingAll(true);
    try {
      const data = await aiProjectService.regenerate(project.id);
      onProjectChange(data.project, data.issues || [], data.credits);
      setDraft(null);
      setRegenAllOpen(false);
      toast.success('Project regenerated.', { description: 'One AI credit was used.' });
    } catch (err) {
      toast.error(err.message || 'The project could not be regenerated.');
    } finally {
      setRegeneratingAll(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await aiProjectService.download(project.id);
      const name = (project.title || 'portiai-project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      saveBlob(blob, `${name || 'portiai-project'}.zip`);
      toast.success('ZIP downloaded.');
    } catch (err) {
      toast.error(err.message || 'The project could not be downloaded.');
    } finally {
      setDownloading(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await aiProjectService.remove(project.id);
      toast.success('Project deleted.');
      onDeleted?.();
    } catch (err) {
      toast.error(err.message || 'The project could not be deleted.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            All projects
          </button>
          <h1 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink">{project.title}</h1>
          <p className="mt-1 max-w-2xl text-[12.5px] leading-5 text-muted">{project.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {credits ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent-line bg-accent-soft px-2.5 py-1 text-[10.5px] font-semibold text-accent-hover">
              <Sparkles size={10} aria-hidden="true" />
              {credits.remaining} credits
            </span>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={13} aria-hidden="true" />
            Add to portfolio
          </Button>
          <Button size="sm" onClick={download} loading={downloading}>
            <Download size={13} aria-hidden="true" />
            Download ZIP
          </Button>
        </div>
      </div>

      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <FolderTree size={12} className="text-faint" aria-hidden="true" />
          {files.length} files
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Code2 size={12} className="text-faint" aria-hidden="true" />
          {project.stackLabel}
        </span>
        {project.generatedAt ? <span>Generated {formatDate(project.generatedAt)}</span> : null}
        {project.model ? <span className="truncate font-mono text-[10.5px] text-faint">{project.model}</span> : null}
        {project.previewSupported ? (
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle2 size={11} aria-hidden="true" />
            Preview available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-faint" title="This stack needs a build step or backend, so there is no in-browser preview.">
            <Info size={11} aria-hidden="true" />
            No in-browser preview for this stack
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRegenAllOpen(true)}
            disabled={regeneratingAll}
            className="btn-ghost btn-sm text-muted hover:text-ink disabled:opacity-50"
          >
            <RefreshCcw size={12} aria-hidden="true" />
            Regenerate all
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="btn-ghost btn-sm text-faint hover:bg-dangerSoft hover:text-danger"
            aria-label="Delete project"
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Issues */}
      {issues.length ? (
        <div className={`rounded-lg border p-3.5 ${errorIssues.length ? 'border-dangerLine bg-dangerSoft' : 'border-warningLine bg-warningSoft'}`}>
          <p className={`flex items-center gap-2 text-[12px] font-semibold ${errorIssues.length ? 'text-danger' : 'text-warning'}`}>
            <AlertTriangle size={14} aria-hidden="true" />
            {errorIssues.length
              ? `${errorIssues.length} problem${errorIssues.length === 1 ? '' : 's'} need attention`
              : `${warningIssues.length} suggestion${warningIssues.length === 1 ? '' : 's'}`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {issues.slice(0, 6).map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="text-[11.5px] leading-5 text-inkSoft">
                <span className="font-medium">{issue.file || 'Project'}:</span> {issue.message}
                {issue.fix ? <span className="text-muted"> {issue.fix}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-line px-2 py-1.5">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                tab === id ? 'bg-canvasAlt text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon size={13} aria-hidden="true" />
              {label}
            </button>
          ))}
          {tab === 'preview' && project.previewSupported ? (
            <div className="ml-auto hidden items-center gap-1 sm:flex">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                aria-pressed={device === 'desktop'}
                className={`rounded p-1.5 ${device === 'desktop' ? 'bg-canvasAlt text-ink' : 'text-faint hover:text-ink'}`}
                aria-label="Desktop preview"
              >
                <Monitor size={13} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                aria-pressed={device === 'mobile'}
                className={`rounded p-1.5 ${device === 'mobile' ? 'bg-canvasAlt text-ink' : 'text-faint hover:text-ink'}`}
                aria-label="Mobile preview"
              >
                <Smartphone size={13} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>

        {/* Preview */}
        {tab === 'preview' ? (
          project.previewSupported && project.previewHtml ? (
            <div className="bg-canvasAlt p-3 sm:p-5">
              <div
                className={`mx-auto overflow-hidden rounded-lg border border-lineStrong bg-white shadow-raised transition-[max-width] ${
                  device === 'mobile' ? 'max-w-[390px]' : 'max-w-full'
                }`}
              >
                <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger/60" aria-hidden="true" />
                  <span className="h-2 w-2 rounded-full bg-warning/60" aria-hidden="true" />
                  <span className="h-2 w-2 rounded-full bg-success/60" aria-hidden="true" />
                  <span className="ml-2 truncate font-mono text-[10px] text-faint">
                    preview · {project.entryFile} · sandboxed
                  </span>
                </div>
                <iframe
                  title={`${project.title} preview`}
                  srcDoc={project.previewHtml}
                  sandbox="allow-scripts allow-forms allow-modals"
                  className="h-[560px] w-full bg-white"
                />
              </div>
              <p className="mt-2 text-center text-[10.5px] text-faint">
                Static preview with scripts enabled in a sandbox. Network calls, downloads and storage are disabled.
              </p>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Monitor size={26} className="mx-auto text-faint" aria-hidden="true" />
              <p className="mt-3 text-[14px] font-medium text-ink">This stack needs a local dev server</p>
              <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-6 text-muted">
                {project.stackLabel} projects include a build step or backend, so PortiAI cannot run them safely in the
                browser. Download the ZIP or open the Setup tab for the exact commands.
              </p>
              <Button className="mt-4" onClick={download} loading={downloading}>
                <Download size={13} aria-hidden="true" />
                Download ZIP
              </Button>
            </div>
          )
        ) : null}

        {/* Code */}
        {tab === 'code' ? (
          <div className="grid lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="border-b border-line bg-canvas lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-faint">Files</p>
                <span className="text-[10px] tabular-nums text-faint">{files.length}</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto pb-2">
                {groups.map(({ folder, items }) => (
                  <div key={folder || 'root'} className="mb-1">
                    <p className="flex items-center gap-1.5 px-3 py-1 text-[10.5px] font-medium text-muted">
                      <FolderOpen size={11} className="text-faint" aria-hidden="true" />
                      {folder || 'root'}
                    </p>
                    {items.map((file) => {
                      const active = selectedFile?.path === file.path;
                      return (
                        <button
                          key={file.path}
                          type="button"
                          onClick={() => selectFile(file.path)}
                          className={`flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[11.5px] transition-colors ${
                            active ? 'bg-accent-soft font-medium text-ink' : 'text-inkSoft hover:bg-surfaceRaised'
                          }`}
                          title={file.path}
                        >
                          <ChevronRight
                            size={10}
                            className={active ? 'text-accent-hover' : 'text-transparent'}
                            aria-hidden="true"
                          />
                          <FileCode2 size={11} className="shrink-0 text-faint" aria-hidden="true" />
                          <span className="truncate">{file.path.split('/').pop()}</span>
                          {file.path === project.entryFile ? (
                            <span className="ml-auto shrink-0 rounded bg-canvasAlt px-1 text-[9px] uppercase tracking-wide text-faint">
                              entry
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </aside>

            <div className="min-w-0">
              {selectedFile ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
                    <p className="min-w-0 truncate font-mono text-[11px] text-muted">{selectedFile.path}</p>
                    <span className="rounded bg-canvasAlt px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide text-faint">
                      {selectedFile.language || 'text'}
                    </span>
                    {dirty ? <span className="text-[10px] font-medium text-warning">Unsaved</span> : null}
                    <div className="ml-auto flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => copy(content, 'File copied.')}
                        className="btn-ghost btn-sm text-muted hover:text-ink"
                      >
                        <Copy size={12} aria-hidden="true" />
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRegenMode('regenerate');
                          setInstruction('');
                          setRegenOpen(true);
                        }}
                        className="btn-ghost btn-sm text-muted hover:text-ink"
                      >
                        <Wand2 size={12} aria-hidden="true" />
                        AI edit
                      </button>
                      <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
                        <Save size={12} aria-hidden="true" />
                        Save
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={content}
                    onChange={(event) => setDraft(event.target.value)}
                    spellCheck={false}
                    aria-label={`${selectedFile.path} content`}
                    className="h-[430px] w-full resize-y bg-[#0f1115] px-4 py-3 font-mono text-[12px] leading-6 text-[#e6e6e6] outline-none focus:ring-2 focus:ring-inset focus:ring-accent-line"
                  />
                  <div className="flex items-center justify-between border-t border-line px-3 py-1.5 text-[10px] text-faint">
                    <span>{content.split('\n').length} lines</span>
                    <span>Manual edits are free and saved to your project.</span>
                  </div>
                </>
              ) : (
                <p className="p-6 text-[12px] text-muted">This project has no files.</p>
              )}
            </div>
          </div>
        ) : null}

        {/* README */}
        {tab === 'readme' ? (
          <div>
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <p className="font-mono text-[11px] text-muted">README.md</p>
              <button type="button" onClick={() => copy(project.readme || '', 'README copied.')} className="btn-ghost btn-sm">
                <Copy size={12} aria-hidden="true" />
                Copy
              </button>
            </div>
            {project.readme ? (
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-[12px] leading-6 text-inkSoft">
                {project.readme}
              </pre>
            ) : (
              <p className="p-6 text-[12px] text-muted">No README was generated for this project.</p>
            )}
          </div>
        ) : null}

        {/* Setup */}
        {tab === 'setup' ? (
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Run it locally</p>
              <ol className="mt-2.5 space-y-2">
                {(project.setupSteps?.length
                  ? project.setupSteps
                  : ['Download the ZIP and extract it.', 'Install the dependencies listed below.', 'Start the project and open the local URL.']
                ).map((step, index) => (
                  <li key={`${step}-${index}`} className="flex gap-2.5 text-[12px] leading-6 text-inkSoft">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-canvasAlt font-mono text-[10px] text-muted">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Technologies</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(project.techStack || []).map((tech) => (
                  <span key={tech} className="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[11px] text-inkSoft">
                    {tech}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">Dependencies</p>
              {project.dependencies?.length ? (
                <ul className="mt-2 space-y-1 font-mono text-[11.5px] leading-5 text-muted">
                  {project.dependencies.map((dependency) => (
                    <li key={dependency}>{dependency}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[11.5px] text-muted">No external dependencies.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Regenerate one file */}
      <Modal
        open={regenOpen}
        onClose={regeneratingFile ? () => {} : () => setRegenOpen(false)}
        title="Edit this file with AI"
        description={selectedFile?.path}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRegenOpen(false)} disabled={regeneratingFile}>
              Cancel
            </Button>
            <Button onClick={regenerateFile} loading={regeneratingFile}>
              <Wand2 size={13} aria-hidden="true" />
              {regenMode === 'modify' ? 'Apply change' : 'Regenerate file'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-1.5">
            {[
              ['regenerate', 'Rewrite from scratch'],
              ['modify', 'Make a specific change'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRegenMode(value)}
                aria-pressed={regenMode === value}
                className={`rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium ${
                  regenMode === value ? 'border-accent-line bg-accent-soft text-ink' : 'border-line bg-canvas text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-[11.5px] font-medium text-inkSoft">
              {regenMode === 'modify' ? 'What should change?' : 'Extra guidance (optional)'}
            </span>
            <textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value.slice(0, 1200))}
              rows={4}
              placeholder={
                regenMode === 'modify'
                  ? 'Add form validation for empty fields and show an error under the input.'
                  : 'Keep the existing structure but use clearer function names.'
              }
              className="mt-1.5 w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2 text-[12px] leading-6 text-ink placeholder:text-faint focus:border-accent-line focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </label>
          <p className="rounded-md border border-line bg-canvasAlt px-3 py-2 text-[11px] leading-5 text-muted">
            Uses <strong className="font-semibold text-ink">1 AI credit</strong>. Other files are not changed.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={regenAllOpen}
        onClose={() => setRegenAllOpen(false)}
        onConfirm={regenerateAll}
        title="Regenerate the whole project?"
        description="The AI rebuilds every file from your original idea. Manual edits to files will be replaced, and one AI credit is used."
        confirmLabel="Regenerate project"
        cancelLabel="Keep current files"
        tone="primary"
        busy={regeneratingAll}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={remove}
        title="Delete this project?"
        description="The generated files and preview are removed from your account. Projects already added to a portfolio stay there."
        confirmLabel="Delete project"
        busy={deleting}
      />

      <AddToPortfolioDialog open={addOpen} onClose={() => setAddOpen(false)} project={project} />

      {regeneratingAll ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-overlay">
          <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] text-ink shadow-float">
            <Loader2 size={16} className="animate-spin text-accent" aria-hidden="true" />
            Rebuilding every file…
          </div>
        </div>
      ) : null}
    </div>
  );
}
