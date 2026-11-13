import { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, ScrollText, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/Kit.jsx';
import { Alert, Button, Field, Spinner } from '../../components/ui/Primitives.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import { Badge, FilterBar, Pager, TableWrap, Td, Th, dateTime } from '../../components/admin/ui.jsx';
import { adminService } from '../../services/adminService.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function Settings() {
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meData, logsData] = await Promise.all([
        adminService.me(),
        adminService.auditLogs({ page, limit: 25, search }),
      ]);
      setMe(meData.user);
      setLogs(logsData.logs);
      setPages(logsData.pages);
      setTotal(logsData.total);
    } catch (err) {
      setError(err.message || 'Settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    const nextErrors = {};
    if (!form.currentPassword) nextErrors.currentPassword = 'Enter your current password.';
    if (!form.newPassword || form.newPassword.length < 8) nextErrors.newPassword = 'New password must be at least 8 characters.';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }
    setSaving(true);
    try {
      await adminService.changePassword(form);
      setForm({ currentPassword: '', newPassword: '' });
      toast.success('Password updated. Other devices have been signed out.');
      await load();
    } catch (err) {
      toast.error(err.message || 'The password could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !me) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner label="Loading settings…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Settings"
        description="Administrator profile, password and the audit log of every sensitive action."
        actions={
          <Button variant="secondary" size="sm" onClick={load} loading={loading}>
            <RefreshCcw size={13} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {error ? (
        <Alert tone="error" title="Settings unavailable">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="surface-card p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <ShieldCheck size={14} aria-hidden="true" />
            Administrator profile
          </h2>
          {me ? (
            <dl className="mt-3 divide-y divide-line">
              {[
                ['Name', me.name],
                ['Email', me.email],
                ['Role', <Badge key="role" value="admin" />],
                ['Status', <Badge key="status" value={me.status} />],
                ['Account created', dateTime(me.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 py-2 text-[12px]">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="mt-3 rounded-lg border border-line bg-canvas px-3 py-2 text-[11.5px] leading-relaxed text-muted">
            Your role cannot be changed from profile settings. Administrator roles are granted only by the operator
            provisioning script or the ADMIN_EMAILS allow-list.
          </p>
        </section>

        <section className="surface-card p-4">
          <h2 className="text-[13px] font-semibold text-ink">Change password</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">Requires your current password. Other sessions are signed out.</p>
          <form onSubmit={onSubmit} className="mt-3 space-y-3" noValidate>
            <Field label="Current password" htmlFor="current-password" required error={fieldErrors.currentPassword}>
              <PasswordInput
                id="current-password"
                value={form.currentPassword}
                onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
              />
            </Field>
            <Field label="New password" htmlFor="new-password" required error={fieldErrors.newPassword} hint="At least 8 characters, with a letter and a number.">
              <PasswordInput
                id="new-password"
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
              />
            </Field>
            <Button type="submit" size="sm" loading={saving} disabled={saving}>
              Update password
            </Button>
          </form>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText size={14} className="text-muted" aria-hidden="true" />
          <h2 className="text-[13px] font-semibold text-ink">Admin activity log</h2>
        </div>
        <FilterBar search={search} onSearch={setSearch} />
        {logs.length === 0 && !loading ? (
          <div className="rounded-xl border border-line bg-surface px-4 py-6 text-center text-[12px] text-muted">
            No admin actions recorded yet.
          </div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[760px] border-collapse">
              <thead className="bg-canvasAlt">
                <tr>
                  <Th>Action</Th>
                  <Th>Admin</Th>
                  <Th>Target</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <Td className="font-mono text-[11px]">{log.action}</Td>
                    <Td>{log.adminEmail}</Td>
                    <Td>{log.targetEmail || log.targetId || '—'}</Td>
                    <Td className="whitespace-nowrap text-muted">{dateTime(log.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
              <Pager page={page} pages={pages} total={total} onPage={setPage} />
            </table>
          </TableWrap>
        )}
      </section>
    </div>
  );
}
