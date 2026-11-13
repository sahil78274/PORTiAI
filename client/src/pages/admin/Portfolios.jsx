import { useCallback, useEffect, useState } from 'react';
import { Eye, FolderOpen, RefreshCcw, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner } from '../../components/ui/Primitives.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Badge, FilterBar, Pager, TableWrap, Td, Th, dateTime } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.jsx';

const PUBLISHED_OPTIONS = [
  { value: 'all', label: 'All portfolios' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

export default function Portfolios() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ published: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.portfolios({ page, limit: 25, search, ...filters });
      setRows(data.portfolios);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Portfolios could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const result = await adminService.portfolio(id);
      setDetail(result.portfolio);
    } catch (err) {
      toast.error(err.message || 'Portfolio details could not be loaded.');
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async () => {
    setBusy(true);
    try {
      if (confirm.kind === 'unpublish') {
        await adminService.unpublishPortfolio(confirm.row.id);
        toast.success('Portfolio unpublished.');
      } else {
        await adminService.deletePortfolio(confirm.row.id);
        toast.success('Portfolio deleted.');
      }
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'That action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Portfolios"
        description="Every portfolio on the platform. Unpublish or delete portfolios that violate policy."
        actions={
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <RefreshCcw size={13} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearch={setSearch}
        selects={[{ key: 'published', label: 'Status', options: PUBLISHED_OPTIONS }]}
        onChange={{ values: filters, set: setFilter }}
      />

      {error ? (
        <Alert tone="error" title="Portfolios unavailable">
          {error}
        </Alert>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner label="Loading portfolios…" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No portfolios match" description="Try a different search or filter." />
      ) : (
        <TableWrap>
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-canvasAlt">
              <tr>
                <Th>Portfolio</Th>
                <Th>Owner</Th>
                <Th>Template</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td>
                    <span className="block font-medium text-ink">{row.title}</span>
                    <span className="block font-mono text-[10.5px] text-faint">{row.slug ? `/p/${row.slug}` : 'no slug'}</span>
                  </Td>
                  <Td>{row.userEmail || '—'}</Td>
                  <Td className="capitalize">{row.templateId}</Td>
                  <Td>
                    <Badge value={row.published ? 'published' : 'draft'} />
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{dateTime(row.createdAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button variant="secondary" size="xs" onClick={() => openDetail(row.id)}>
                        <Eye size={11} aria-hidden="true" />
                        Details
                      </Button>
                      {row.published ? (
                        <Button variant="secondary" size="xs" onClick={() => setConfirm({ kind: 'unpublish', row })}>
                          Unpublish
                        </Button>
                      ) : null}
                      <Button variant="secondary" size="xs" onClick={() => setConfirm({ kind: 'delete', row })}>
                        <Trash2 size={11} aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            <Pager page={page} pages={pages} total={total} onPage={setPage} />
          </table>
        </TableWrap>
      )}

      <Modal open={Boolean(detail) || detailLoading} onClose={() => setDetail(null)} title="Portfolio details" size="md">
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center py-8">
            <Spinner label="Loading portfolio…" />
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Title', detail.title],
              ['Owner', detail.userEmail],
              ['Profile name', detail.fullName || '—'],
              ['Professional title', detail.professionalTitle || '—'],
              ['Template', detail.templateId],
              ['Status', <Badge key="status" value={detail.published ? 'published' : 'draft'} />],
              ['Projects', detail.projectCount],
              ['Skills', detail.skillCount],
              ['Created', dateTime(detail.createdAt)],
              ['Published', detail.publishedAt ? dateTime(detail.publishedAt) : '—'],
              ['Updated', dateTime(detail.updatedAt)],
              ['Public URL', detail.slug ? `/p/${detail.slug}` : 'Not published'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">{label}</dt>
                <dd className="mt-0.5 break-words text-[12px] font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        busy={busy}
        tone={confirm?.kind === 'delete' ? 'danger' : 'primary'}
        title={confirm?.kind === 'delete' ? 'Delete this portfolio?' : 'Unpublish this portfolio?'}
        description={
          confirm?.kind === 'delete'
            ? `"${confirm?.row?.title}" and its blog posts will be permanently deleted. This cannot be undone.`
            : `"${confirm?.row?.title}" will be taken offline immediately. The owner can publish it again.`
        }
        confirmLabel={confirm?.kind === 'delete' ? 'Delete portfolio' : 'Unpublish'}
        onConfirm={runAction}
      />
    </div>
  );
}
