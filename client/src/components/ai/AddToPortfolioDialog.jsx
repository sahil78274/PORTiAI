import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, FolderOpen, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { Button, EmptyState } from '../ui/Primitives.jsx';
import { portfolioService } from '../../services/portfolioService.js';
import { aiProjectService } from '../../services/aiProjectService.js';
import { useToast } from '../../context/ToastContext.jsx';

/**
 * Appends the generated project to one of the user's portfolios.
 * The server copies the title, description and technologies and enforces the
 * 20-project limit; nothing here is written directly.
 */
export default function AddToPortfolioDialog({ open, onClose, project }) {
  const toast = useToast();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setError('');
    setResult(null);
    portfolioService
      .list()
      .then((data) => {
        if (!alive) return;
        const list = data?.portfolios || [];
        setPortfolios(list);
        setSelected(list[0]?.id || '');
      })
      .catch((err) => alive && setError(err.message || 'Your portfolios could not be loaded.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open]);

  const add = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const data = await aiProjectService.addToPortfolio(project.id, selected);
      setResult(data);
      toast.success('Added to your portfolio.', {
        description: data?.message || 'Upload a screenshot from the editor to complete the card.',
      });
    } catch (err) {
      toast.error(err.message || 'The project could not be added.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title="Add project to a portfolio"
      description={project?.title}
      size="md"
      footer={
        result ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Link to={`/dashboard/portfolio/${result.portfolio?.id}/edit`} className="btn-primary btn-sm">
              Open editor
              <ExternalLink size={13} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={add} loading={saving} disabled={!selected}>
              Add project
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="rounded-lg border border-successLine bg-successSoft p-4 text-[13px] leading-6 text-success">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={15} aria-hidden="true" />
            Added to {result.portfolio?.title}
          </p>
          <p className="mt-1 text-[12px] text-inkSoft">{result.message}</p>
          <p className="mt-2 text-[12px] text-muted">
            The card uses a designed placeholder until you upload a screenshot in the editor.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin text-accent" aria-label="Loading portfolios" />
        </div>
      ) : error ? (
        <p className="rounded-md border border-dangerLine bg-dangerSoft p-3 text-[12px] text-danger">{error}</p>
      ) : portfolios.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No portfolios yet"
          description="Create a portfolio first, then add this project to it."
          action={
            <Link to="/dashboard/create" className="btn-primary btn-sm">
              Create a portfolio
            </Link>
          }
        />
      ) : (
        <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
          {portfolios.map((portfolio) => (
            <label
              key={portfolio.id}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                selected === portfolio.id ? 'border-accent-line bg-accent-soft' : 'border-line bg-canvas hover:border-lineStrong'
              }`}
            >
              <input
                type="radio"
                name="portfolio"
                value={portfolio.id}
                checked={selected === portfolio.id}
                onChange={() => setSelected(portfolio.id)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">{portfolio.title}</span>
                <span className="mt-0.5 block text-[11px] text-muted">
                  {(portfolio.projects?.length || 0)} projects · {portfolio.published ? 'Published' : 'Draft'}
                </span>
              </span>
            </label>
          ))}
          <p className="pt-1 text-[11px] leading-5 text-faint">
            The project title, description and technologies are copied. You can edit them, upload a screenshot and add
            live or GitHub links in the editor.
          </p>
        </div>
      )}
    </Modal>
  );
}
