import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import TemplateGallery from '../components/templates/TemplateGallery.jsx';
import { portfolioService } from '../services/portfolioService.js';

export default function TemplatesWorkspace() {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await portfolioService.list({ sort: 'updated' });
      setPortfolios(data.portfolios || []);
    } catch {
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Template gallery"
        title="Pick the design language for your work"
        description="Nine complete design systems with their own typography, spacing and section treatment. Preview with sample content, then create a draft in one click."
        actions={
          <>
            <Link to="/dashboard/portfolios" className="btn-secondary btn-sm">
              <FolderOpen size={14} aria-hidden="true" />
              My portfolios
            </Link>
            <Link to="/dashboard/builder" className="btn-primary btn-sm">
              <Sparkles size={14} aria-hidden="true" />
              Build with AI
            </Link>
          </>
        }
      />

      {!loading ? (
        <TemplateGallery mode="workspace" usedTemplateIds={portfolios.map((portfolio) => portfolio.templateId)} onChanged={load} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card overflow-hidden p-4">
              <div className="skeleton aspect-[16/11] w-full" />
              <div className="skeleton mt-4 h-4 w-32" />
              <div className="skeleton mt-2 h-3 w-48" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
