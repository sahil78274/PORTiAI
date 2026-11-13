import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, Eye, RefreshCcw, Trash2, Users as UsersIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/Kit.jsx';
import { Alert, Button, EmptyState, Spinner } from '../../components/ui/Primitives.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Badge, FilterBar, Pager, TableWrap, Td, Th, dateOnly, dateTime } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.jsx';

const PLAN_OPTIONS = [
  { value: 'all', label: 'All plans' },
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'email', label: 'Email A–Z' },
];

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ plan: 'all', status: 'all', sort: 'newest' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.users({ page, limit: 25, search, ...filters });
      setUsers(data.users);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setError(err.message || 'Users could not be loaded.');
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

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      setDetail(await adminService.user(id));
    } catch (err) {
      toast.error(err.message || 'User details could not be loaded.');
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (action) => {
    setBusy(true);
    try {
      await action();
      setConfirm(null);
      setDetail(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'That action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Search, filter and manage every registered account. Passwords and authentication secrets are never shown."
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
          { key: 'plan', label: 'Plan', options: PLAN_OPTIONS },
          { key: 'status', label: 'Status', options: STATUS_OPTIONS },
          { key: 'sort', label: 'Sort', options: SORT_OPTIONS },
        ]}
        onChange={{ values: filters, set: setFilter }}
      />

      {error ? (
        <Alert tone="error" title="Users unavailable">
          {error}
        </Alert>
      ) : null}

      {loading && users.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner label="Loading users…" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users match" description="Try a different search or filter." />
      ) : (
        <TableWrap>
          <table className="w-full min-w-[860px] border-collapse">
            <thead className="bg-canvasAlt">
              <tr>
                <Th>User</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th>Portfolios</Th>
                <Th>AI projects</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => (
                <tr key={user.id}>
                  <Td>
                    <span className="block font-medium text-ink">{user.name}</span>
                    <span className="block text-[11px] text-faint">{user.email}</span>
                  </Td>
                  <Td>
                    <Badge value={user.plan} />
                  </Td>
                  <Td>
                    <Badge value={user.status} />
                  </Td>
                  <Td className="tabular-nums">{user.portfolioCount}</Td>
                  <Td className="tabular-nums">{user.aiProjectCount}</Td>
                  <Td className="whitespace-nowrap text-muted">{dateOnly(user.createdAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button variant="secondary" size="xs" onClick={() => openDetail(user.id)}>
                        <Eye size={11} aria-hidden="true" />
                        View
                      </Button>
                      {user.status === 'active' ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          disabled={user.isAdmin}
                          onClick={() => setConfirm({ kind: 'suspend', user })}
                        >
                          <Ban size={11} aria-hidden="true" />
                          Suspend
                        </Button>
                      ) : (
                        <Button variant="secondary" size="xs" onClick={() => setConfirm({ kind: 'reactivate', user })}>
                          <CheckCircle2 size={11} aria-hidden="true" />
                          Reactivate
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="xs"
                        disabled={user.isAdmin}
                        onClick={() => setConfirm({ kind: 'delete', user })}
                      >
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

      <Modal open={Boolean(detail) || detailLoading} onClose={() => setDetail(null)} title="User details" size="lg">
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center py-8">
            <Spinner label="Loading details…" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Name</p>
                <p className="mt-0.5 text-sm font-medium text-ink">{detail.user.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Email</p>
                <p className="mt-0.5 text-sm text-ink">{detail.user.email}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Plan</p>
                <p className="mt-0.5 text-sm text-ink">
                  <Badge value={detail.user.plan} />{' '}
                  <span className="text-muted">
                    {detail.user.premiumUntil ? `until ${dateOnly(detail.user.premiumUntil)}` : 'no expiry'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Status</p>
                <p className="mt-0.5 text-sm text-ink">
                  <Badge value={detail.user.status} />
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Registered</p>
                <p className="mt-0.5 text-sm text-ink">{dateTime(detail.user.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Last sign-in</p>
                <p className="mt-0.5 text-sm text-ink">{detail.user.lastLoginAt ? dateTime(detail.user.lastLoginAt) : 'Never'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Portfolios</p>
                <p className="mt-0.5 text-sm text-ink">{detail.user.portfolioCount}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">AI generations</p>
                <p className="mt-0.5 text-sm text-ink">
                  {detail.aiUsage.total} total · {detail.aiUsage.success} success · {detail.aiUsage.failed} failed
                </p>
              </div>
            </div>

            {detail.subscription ? (
              <div className="rounded-lg border border-line bg-canvas p-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Subscription</p>
                <p className="mt-1 text-[12px] text-inkSoft">
                  <Badge value={detail.subscription.status} /> {detail.subscription.interval || 'manual'} ·{' '}
                  {detail.subscription.currentPeriodStart ? dateOnly(detail.subscription.currentPeriodStart) : '—'} →{' '}
                  {detail.subscription.currentPeriodEnd ? dateOnly(detail.subscription.currentPeriodEnd) : '—'}
                </p>
              </div>
            ) : null}

            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Recent portfolios</p>
              {detail.portfolios.length === 0 ? (
                <p className="text-[12px] text-muted">No portfolios created.</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {detail.portfolios.slice(0, 5).map((portfolio) => (
                    <li key={portfolio.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[12px]">
                      <span className="min-w-0 truncate font-medium text-ink">{portfolio.title}</span>
                      <span className="text-muted">{portfolio.templateId}</span>
                      <Badge value={portfolio.published ? 'published' : 'draft'} />
                      <span className="whitespace-nowrap text-faint">{dateOnly(portfolio.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Recent payments</p>
              {detail.payments.length === 0 ? (
                <p className="text-[12px] text-muted">No payments recorded.</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {detail.payments.slice(0, 5).map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[12px]">
                      <span className="capitalize text-muted">{payment.kind}</span>
                      <span className="tabular-nums text-ink">₹{payment.amountMajor}</span>
                      <Badge value={payment.status} />
                      <span className="whitespace-nowrap text-faint">{dateOnly(payment.paidAt || payment.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!detail.user.isAdmin ? (
              <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                {detail.user.plan === 'premium' ? (
                  <Button variant="secondary" size="sm" onClick={() => setConfirm({ kind: 'revoke', user: detail.user })}>
                    Revoke Premium
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setConfirm({ kind: 'grant', user: detail.user })}>
                    Grant Premium (1 month)
                  </Button>
                )}
                {detail.user.status === 'active' ? (
                  <Button variant="secondary" size="sm" onClick={() => setConfirm({ kind: 'suspend', user: detail.user })}>
                    Suspend account
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setConfirm({ kind: 'reactivate', user: detail.user })}>
                    Reactivate account
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => setConfirm({ kind: 'delete', user: detail.user })}>
                  Delete user
                </Button>
              </div>
            ) : (
              <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-[11.5px] text-muted">
                Administrator accounts are managed only through the operator provisioning script.
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        busy={busy}
        tone={confirm?.kind === 'delete' ? 'danger' : 'primary'}
        title={
          confirm?.kind === 'delete'
            ? 'Delete this user?'
            : confirm?.kind === 'suspend'
              ? 'Suspend this account?'
              : confirm?.kind === 'reactivate'
                ? 'Reactivate this account?'
                : confirm?.kind === 'grant'
                  ? 'Grant Premium?'
                  : 'Revoke Premium?'
        }
        description={
          confirm?.kind === 'delete'
            ? `${confirm.user.name} (${confirm.user.email}) and all of their portfolios, blog posts, payments and AI projects will be permanently deleted. This cannot be undone.`
            : confirm?.kind === 'suspend'
              ? `${confirm.user.name} will be signed out everywhere and will not be able to sign in until reactivated.`
              : confirm?.kind === 'reactivate'
                ? `${confirm.user.name} will be able to sign in again.`
                : confirm?.kind === 'grant'
                  ? `Premium will be granted to ${confirm.user.name} for 1 month. A manual payment record is created and this action is written to the audit log.`
                  : `Premium access for ${confirm.user.name} will end immediately and the subscription will be cancelled.`
        }
        confirmLabel={
          confirm?.kind === 'delete'
            ? 'Delete user'
            : confirm?.kind === 'suspend'
              ? 'Suspend'
              : confirm?.kind === 'reactivate'
                ? 'Reactivate'
                : confirm?.kind === 'grant'
                  ? 'Grant Premium'
                  : 'Revoke Premium'
        }
        onConfirm={() => {
          const target = confirm.user;
          if (confirm.kind === 'delete') {
            runAction(async () => {
              await adminService.deleteUser(target.id);
              toast.success('User deleted.');
            });
          } else if (confirm.kind === 'suspend') {
            runAction(async () => {
              await adminService.suspendUser(target.id, 'Suspended by administrator');
              toast.success('Account suspended.');
            });
          } else if (confirm.kind === 'reactivate') {
            runAction(async () => {
              await adminService.reactivateUser(target.id);
              toast.success('Account reactivated.');
            });
          } else if (confirm.kind === 'grant') {
            runAction(async () => {
              await adminService.grantPremium(target.id, { months: 1, reason: 'Granted from admin panel' });
              toast.success('Premium granted.');
            });
          } else {
            runAction(async () => {
              await adminService.revokePremium(target.id, 'Revoked from admin panel');
              toast.success('Premium revoked.');
            });
          }
        }}
      />
    </div>
  );
}
