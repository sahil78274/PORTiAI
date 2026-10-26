import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, FilePlus2, LayoutTemplate, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { getTemplate } from '../utils/templates.js';

export default function StartProject() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const templateId = params.get('template');
  const template = templateId ? getTemplate(templateId) : null;

  const createBlank = async () => {
    setCreating(true);
    try {
      const data = await portfolioService.create({ templateId: template?.id || 'minimal', title: template ? `${template.name} portfolio` : 'Untitled portfolio' });
      toast.success('Empty draft created.');
      navigate(`/dashboard/portfolio/${data.portfolio.id}/edit`);
    } catch (error) {
      toast.error(error.message || 'Could not create the portfolio.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New portfolio"
        title={template ? `Start with ${template.name}` : 'How would you like to start?'}
        description="The AI builder collects your background and drafts the copy. Templates give you a design-first start. Both open the same editor."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Link to={`/dashboard/builder${template ? `?template=${template.id}` : ''}`} className="card group flex flex-col p-6 transition-all hover:-translate-y-1 hover:border-accent-line">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-semibold text-white">Create with AI</p>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
            Answer a guided conversation about your role, projects and skills. The AI drafts editable copy from your
            facts only.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-hover">
            Open the builder
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>

        <Link to="/dashboard/templates" className="card group flex flex-col p-6 transition-all hover:-translate-y-1 hover:border-accent-line">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-accent-hover">
            <LayoutTemplate size={19} aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-semibold text-white">Browse templates</p>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
            Start from one of nine design systems. Preview each one with sample content before committing.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-hover">
            View gallery
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>

        <button type="button" onClick={createBlank} disabled={creating} className="card group flex flex-col p-6 text-left transition-all hover:-translate-y-1 hover:border-accent-line disabled:opacity-60">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-accent-hover">
            <FilePlus2 size={19} aria-hidden="true" />
          </span>
          <p className="mt-4 text-base font-semibold text-white">{creating ? 'Creating draft…' : 'Start from blank'}</p>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">
            {template ? `Create an empty ${template.name} draft and fill every field manually.` : 'Create an empty draft and fill every field manually in the editor.'}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-hover">
            Create empty draft
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  );
}
