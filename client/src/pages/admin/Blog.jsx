import { useCallback, useEffect, useState } from 'react';
import { Newspaper, RefreshCcw, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner } from '../../components/ui/Primitives.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Badge, FilterBar, Pager, TableWrap, Td, Th, dateTime } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.jsx';

const PUBLISHED_OPTIONS = [
  { value: 'all', label: 'All posts' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
];

export default function Blog() {
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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.blog({ page, limit: 25, search, ...filters });
      setRows(data.posts);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Blog posts could not be loaded.');
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

  const runAction = async () => {
    setBusy(true);
    try {
      if (confirm.kind === 'delete') {
        await adminService.deleteBlogPost(confirm.row.id);
        toast.success('Post deleted.');
      } else {
        await adminService.setBlogPublished(confirm.row.id, !confirm.row.published);
        toast.success(confirm.row.published ? 'Post unpublished.' : 'Post published.');
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
        title="Blog Management"
        description="Every blog post across all portfolios. Toggle publishing or remove posts."
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
        <Alert tone="error" title="Blog posts unavailable">
          {error}
        </Alert>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner label="Loading blog posts…" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts match" description="Try a different search or filter." />
      ) : (
        <TableWrap>
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="bg-canvasAlt">
              <tr>
                <Th>Post</Th>
                <Th>Author</Th>
                <Th>Status</Th>
                <Th>Published</Th>
                <Th>Updated</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td>
                    <span className="block font-medium text-ink">{row.title}</span>
                    <span className="block font-mono text-[10.5px] text-faint">/{row.slug}</span>
                  </Td>
                  <Td>{row.userEmail || '—'}</Td>
                  <Td>
                    <Badge value={row.published ? 'published' : 'draft'} />
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{row.publishedAt ? dateTime(row.publishedAt) : '—'}</Td>
                  <Td className="whitespace-nowrap text-muted">{dateTime(row.updatedAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button variant="secondary" size="xs" onClick={() => setConfirm({ kind: 'publish', row })}>
                        {row.published ? 'Unpublish' : 'Publish'}
                      </Button>
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

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        busy={busy}
        tone={confirm?.kind === 'delete' ? 'danger' : 'primary'}
        title={
          confirm?.kind === 'delete'
            ? 'Delete this post?'
            : confirm?.row?.published
              ? 'Unpublish this post?'
              : 'Publish this post?'
        }
        description={
          confirm?.kind === 'delete'
            ? `"${confirm?.row?.title}" will be permanently deleted. This cannot be undone.`
            : confirm?.row?.published
              ? `"${confirm?.row?.title}" will be hidden from the public blog immediately.`
              : `"${confirm?.row?.title}" will become publicly visible on the author's blog.`
        }
        confirmLabel={confirm?.kind === 'delete' ? 'Delete post' : confirm?.row?.published ? 'Unpublish' : 'Publish'}
        onConfirm={runAction}
      />
    </div>
  );
}
