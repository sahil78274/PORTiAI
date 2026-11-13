import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner } from '../../components/ui/Primitives.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Badge, FilterBar, Pager, TableWrap, Td, Th, dateOnly, money } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.jsx';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];
const INTERVAL_OPTIONS = [
  { value: 'all', label: 'All intervals' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function Subscriptions() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', interval: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.subscriptions({ page, limit: 25, search, ...filters });
      setRows(data.subscriptions);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Subscriptions could not be loaded.');
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
      if (confirm.kind === 'grant') {
        await adminService.grantPremium(confirm.row.userId, { months: 1, reason: 'Granted from subscriptions page' });
        toast.success('Premium granted.');
      } else {
        await adminService.revokePremium(confirm.row.userId, 'Revoked from subscriptions page');
        toast.success('Premium revoked.');
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
        title="Subscriptions"
        description="Every billing subscription. Premium is only ever granted by a verified payment or an explicit, audited admin action."
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
        selects={[
          { key: 'status', label: 'Status', options: STATUS_OPTIONS },
          { key: 'interval', label: 'Interval', options: INTERVAL_OPTIONS },
        ]}
        onChange={{ values: filters, set: setFilter }}
      />

      {error ? (
        <Alert tone="error" title="Subscriptions unavailable">
          {error}
        </Alert>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner label="Loading subscriptions…" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No subscriptions match" description="Try a different search or filter." />
      ) : (
        <TableWrap>
          <table className="w-full min-w-[1040px] border-collapse">
            <thead className="bg-canvasAlt">
              <tr>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th>Interval</Th>
                <Th>Amount</Th>
                <Th>Period</Th>
                <Th>Latest payment</Th>
                <Th>Plan</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td>
                    <span className="block font-medium text-ink">{row.userName || '—'}</span>
                    <span className="block text-[11px] text-faint">{row.userEmail}</span>
                  </Td>
                  <Td>
                    <Badge value={row.status} />
                  </Td>
                  <Td className="capitalize">{row.interval || 'manual'}</Td>
                  <Td className="whitespace-nowrap tabular-nums">{money(row.amount, row.currency)}</Td>
                  <Td className="whitespace-nowrap text-muted">
                    {row.currentPeriodStart ? dateOnly(row.currentPeriodStart) : '—'} → {row.currentPeriodEnd ? dateOnly(row.currentPeriodEnd) : '—'}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {row.latestPaymentStatus ? (
                      <>
                        <Badge value={row.latestPaymentStatus} />
                        <span className="ml-1.5 text-[10.5px] text-faint">{dateOnly(row.latestPaymentAt)}</span>
                      </>
                    ) : (
                      <span className="text-muted">No payment record</span>
                    )}
                  </Td>
                  <Td>
                    <Badge value={row.userPlan} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {row.userPlan === 'premium' ? (
                        <Button variant="secondary" size="xs" onClick={() => setConfirm({ kind: 'revoke', row })}>
                          Revoke
                        </Button>
                      ) : (
                        <Button variant="secondary" size="xs" onClick={() => setConfirm({ kind: 'grant', row })}>
                          Grant Premium
                        </Button>
                      )}
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
        tone="primary"
        title={confirm?.kind === 'grant' ? 'Grant Premium?' : 'Revoke Premium?'}
        description={
          confirm?.kind === 'grant'
            ? `Premium will be granted to ${confirm.row.userEmail} for 1 month, with a manual payment record and an audit log entry.`
            : `Premium access for ${confirm.row.userEmail} will end immediately and the subscription will be cancelled.`
        }
        confirmLabel={confirm?.kind === 'grant' ? 'Grant Premium' : 'Revoke Premium'}
        onConfirm={runAction}
      />
    </div>
  );
}
