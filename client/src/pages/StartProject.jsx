import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, FilePlus2, LayoutTemplate, Lock, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { getTemplate } from '../utils/templates.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function StartProject() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const { isPremium } = useAuth();
  const templateId = params.get('template');
  const template = templateId ? getTemplate(templateId) : null;
  const templateLocked = template?.tier === 'premium' && !isPremium;

  const createBlank = async () => {
    setCreating(true);
    try {
      const data = await portfolioService.create({ templateId: template?.id || 'developer', title: template ? `${template.name} portfolio` : 'Untitled portfolio' });
      toast.success('Empty draft created.');
      navigate(`/dashboard/portfolio/${data.portfolio.id}/edit`);
    } catch (error) {
      if (error?.code === 'PREMIUM_REQUIRED') {
        toast.error('That design is part of Premium.', {
          description: 'Nothing was created. Pick a free template, or activate Premium on your account.',
        });
      } else {
        toast.error(error.message || 'Could not create the portfolio.');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={template ? `New ${template.name} portfolio` : 'New portfolio'}
        description="The AI builder collects your background and drafts the copy. Templates give you a design-first start. Both open the same editor."
      />

      {templateLocked ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warningLine bg-warningSoft px-4 py-3 text-[12.5px] text-warning">
          <span className="inline-flex items-center gap-2">
            <Lock size={13} aria-hidden="true" />
            <span>
              <span className="font-semibold">{template.name}</span> is a Premium design. Saving a portfolio with it
              needs an active plan on your account.
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <Link to="/premium" className="font-semibold underline underline-offset-2">
              About Premium
            </Link>
            <Link to="/templates?access=free" className="font-semibold underline underline-offset-2">
              Free templates
            </Link>
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Link to={`/dashboard/builder${template ? `?template=${template.id}` : ''}`} className="group flex flex-col rounded-lg border border-line bg-surface p-5 transition-colors hover:border-lineStrong">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-white">
            <Sparkles size={19} aria-hidden="true" />
          </span>
          <p className="mt-3.5 text-[14px] font-semibold text-ink">Create with AI</p>
          <p className="mt-1 flex-1 text-[13px] leading-6 text-muted">
            Answer a guided conversation about your role, projects and skills. The AI drafts editable copy from your
            facts only.
          </p>
          <span className="mt-3.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent-hover">
            Open the builder
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>

        <Link to="/dashboard/templates" className="group flex flex-col rounded-lg border border-line bg-surface p-5 transition-colors hover:border-lineStrong">
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-canvas text-accent-hover">
            <LayoutTemplate size={19} aria-hidden="true" />
          </span>
          <p className="mt-3.5 text-[14px] font-semibold text-ink">Browse templates</p>
          <p className="mt-1 flex-1 text-[13px] leading-6 text-muted">
            Start from one of six design systems. Preview each one with sample content before committing.
          </p>
          <span className="mt-3.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent-hover">
            View gallery
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>

        <button type="button" onClick={createBlank} disabled={creating} className="group flex flex-col rounded-lg border border-line bg-surface p-5 text-left transition-colors hover:border-lineStrong disabled:opacity-60">
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-canvas text-accent-hover">
            <FilePlus2 size={19} aria-hidden="true" />
          </span>
          <p className="mt-3.5 text-[14px] font-semibold text-ink">{creating ? 'Creating draft…' : 'Start from blank'}</p>
          <p className="mt-1 flex-1 text-[13px] leading-6 text-muted">
            {template ? `Create an empty ${template.name} draft and fill every field manually.` : 'Create an empty draft and fill every field manually in the editor.'}
          </p>
          <span className="mt-3.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent-hover">
            Create empty draft
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </button>
      </div>
    </div>
  );
}
