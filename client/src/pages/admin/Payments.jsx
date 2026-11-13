import { useCallback, useEffect, useState } from 'react';
import { CreditCard, RefreshCcw } from 'lucide-react';
import { PageHeader } from '../../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner } from '../../components/ui/Primitives.jsx';
import { Badge, FilterBar, Pager, TableWrap, Td, Th, dateTime, money, shortId } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'captured', label: 'Captured' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
  { value: 'created', label: 'Created' },
  { value: 'refunded', label: 'Refunded' },
];
const KIND_OPTIONS = [
  { value: 'all', label: 'All kinds' },
  { value: 'intro', label: 'Intro' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'manual', label: 'Manual' },
];

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', kind: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.payments({ page, limit: 25, search, ...filters });
      setRows(data.payments);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Payments could not be loaded.');
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

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Payments"
        description="Razorpay transactions and manual grants. Key secrets, webhook secrets and card details are never shown."
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
          { key: 'kind', label: 'Kind', options: KIND_OPTIONS },
        ]}
        onChange={{ values: filters, set: setFilter }}
      />

      {error ? (
        <Alert tone="error" title="Payments unavailable">
          {error}
        </Alert>
      ) : null}

      {loading && rows.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner label="Loading payments…" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments match" description="Try a different search or filter." />
      ) : (
        <TableWrap>
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="bg-canvasAlt">
              <tr>
                <Th>Payment ID</Th>
                <Th>Order ID</Th>
                <Th>Customer</Th>
                <Th>Kind</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Verified</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((payment) => (
                <tr key={payment.id}>
                  <Td className="font-mono text-[10.5px] text-faint">{shortId(payment.providerPaymentId)}</Td>
                  <Td className="font-mono text-[10.5px] text-faint">{shortId(payment.providerOrderId)}</Td>
                  <Td>{payment.userEmail || '—'}</Td>
                  <Td className="capitalize">{payment.kind}</Td>
                  <Td className="whitespace-nowrap tabular-nums">{money(payment.amount, payment.currency)}</Td>
                  <Td>
                    <Badge value={payment.status} />
                  </Td>
                  <Td>{payment.signatureVerified ? 'Yes' : '—'}</Td>
                  <Td className="whitespace-nowrap text-muted">{dateTime(payment.paidAt || payment.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
            <Pager page={page} pages={pages} total={total} onPage={setPage} />
          </table>
        </TableWrap>
      )}
    </div>
  );
}
