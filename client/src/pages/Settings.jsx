import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, KeyRound, ShieldAlert, Sparkles, Trash2, User } from 'lucide-react';
import { Alert, Button, Field, TextInput } from '../components/ui/Primitives.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authService } from '../services/authService.js';
import useAiStatus from '../hooks/useAiStatus.js';
import { formatDate } from '../utils/format.js';

export default function Settings() {
  const { user, refresh, logout } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ name: '', headline: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordDone, setPasswordDone] = useState('');

  const { status: aiStatus } = useAiStatus();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', headline: user.headline || '' });
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError('');
    if (profile.name.trim().length < 2) {
      setProfileError('Your name needs at least two characters.');
      return;
    }
    setProfileSaving(true);
    try {
      await authService.updateAccount({ name: profile.name.trim(), headline: profile.headline.trim() });
      await refresh();
      toast.success('Account details updated.');
    } catch (error) {
      setProfileError(error.message || 'Could not update your account.');
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordDone('');

    if (!passwords.currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (passwords.newPassword.length < 8 || !/[a-zA-Z]/.test(passwords.newPassword) || !/[0-9]/.test(passwords.newPassword)) {
      setPasswordError('The new password must be at least 8 characters and include a letter and a number.');
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      setPasswordError('The new passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await authService.updateAccount({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      setPasswordDone('Password updated. Other active devices have been signed out.');
      toast.success('Password updated.');
    } catch (error) {
      setPasswordError(error.message || 'Could not update your password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleteError('');
    setDeleting(true);
    try {
      await authService.deleteAccount(deletePassword);
      toast.success('Account deleted.');
      await logout().catch(() => {});
      window.location.assign('/');
    } catch (error) {
      setDeleteError(error.message || 'Could not delete your account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Account Settings</h1>
        <p className="mt-1 text-xs text-muted">
          Signed in as <strong className="text-slate-800">{user?.email}</strong> · Member since {formatDate(user?.createdAt)}
        </p>
      </div>

      {/* Profile Section */}
      <section className="card p-6 bg-surface shadow-card">
        <div className="flex items-center gap-2.5 border-b border-line pb-3 mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <User size={15} aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-ink">Personal Profile</h2>
        </div>
        <p className="text-xs text-muted mb-4">Your name is pre-populated as the author name on newly initialized portfolios.</p>

        {profileError ? (
          <Alert tone="error" className="mb-4">
            {profileError}
          </Alert>
        ) : null}

        <form onSubmit={saveProfile} className="space-y-4" noValidate>
          <Field label="Full name" htmlFor="settings-name" required>
            <TextInput
              id="settings-name"
              value={profile.name}
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              maxLength={80}
              autoComplete="name"
            />
          </Field>
          <Field label="Headline" htmlFor="settings-headline" hint="Optional subtitle for internal dashboard records, e.g. 'Software Engineering Intern'.">
            <TextInput
              id="settings-headline"
              value={profile.headline}
              onChange={(event) => setProfile({ ...profile, headline: event.target.value })}
              maxLength={120}
            />
          </Field>
          <Field label="Email" htmlFor="settings-email" hint="Primary login credential. Locked to preserve account authenticity.">
            <TextInput id="settings-email" value={user?.email || ''} disabled readOnly className="bg-slate-100 text-slate-500 cursor-not-allowed" />
          </Field>
          <Button type="submit" variant="primary" loading={profileSaving}>
            <Check size={14} aria-hidden="true" />
            <span>Save Profile</span>
          </Button>
        </form>
      </section>

      {/* Password Section */}
      <section className="card p-6 bg-surface shadow-card">
        <div className="flex items-center gap-2.5 border-b border-line pb-3 mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <KeyRound size={15} aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-ink">Change Password</h2>
        </div>
        <p className="text-xs text-muted mb-4">
          Changing your password invalidates your existing JWT cookies across other sessions.
        </p>

        {passwordError ? (
          <Alert tone="error" className="mb-4">
            {passwordError}
          </Alert>
        ) : null}
        {passwordDone ? (
          <Alert tone="success" className="mb-4">
            {passwordDone}
          </Alert>
        ) : null}

        <form onSubmit={savePassword} className="space-y-4" noValidate>
          <Field label="Current password" htmlFor="current-password" required>
            <PasswordInput
              id="current-password"
              value={passwords.currentPassword}
              onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password" htmlFor="new-password" required>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
              />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm-password" required>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary" loading={passwordSaving}>
            <span>Update Password</span>
          </Button>
        </form>
      </section>

      {/* AI Usage Section */}
      <section className="card p-6 bg-surface shadow-card">
        <div className="flex items-center gap-2.5 border-b border-line pb-3 mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
            <Sparkles size={15} aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-ink">AI Usage & Quota</h2>
        </div>
        <p className="text-xs text-muted mb-4">
          Free-tier Gemini integrations are governed by fair-use rate limiting to guarantee equitable availability.
        </p>
        {aiStatus ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-slate-50/60 p-3.5">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Service Status</p>
              <p className="mt-1 text-xs font-bold text-ink flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${aiStatus.configured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                {aiStatus.configured ? 'Active' : 'Unconfigured'}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-slate-50/60 p-3.5">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Daily Calls</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-ink">
                {aiStatus.usage?.used ?? 0} / {aiStatus.usage?.limit ?? '—'}
              </p>
            </div>
            <div className="rounded-xl border border-line bg-slate-50/60 p-3.5">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted">Scoring Engine</p>
              <p className="mt-1 text-xs font-semibold text-ink">100-pt Rubric Fallback</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">Status unavailable.</p>
        )}
      </section>

      {/* Danger Zone */}
      <section className="card p-6 border-red-200 bg-red-50/30 shadow-card">
        <div className="flex items-center gap-2.5 border-b border-red-200/60 pb-3 mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <ShieldAlert size={15} aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-red-900">Danger Zone</h2>
        </div>
        <p className="text-xs text-red-900/80 mb-4 leading-relaxed">
          Permanently delete your user credentials and all associated portfolios, drafts, and public URLs. This action cannot be reversed.
        </p>
        <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 size={13} aria-hidden="true" />
          <span>Delete my account permanently</span>
        </Button>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletePassword('');
          setDeleteError('');
        }}
        onConfirm={deleteAccount}
        busy={deleting}
        title="Permanently delete your account?"
        description="All portfolios, drafts, and public URLs will be permanently deleted from the database. Type your password to proceed."
        confirmLabel="Delete account permanently"
      >
        <div className="mt-4">
          <Field label="Current Password" htmlFor="delete-password" required error={deleteError}>
            <PasswordInput
              id="delete-password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
            />
          </Field>
          {deleteError ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={13} aria-hidden="true" />
              <span>{deleteError}</span>
            </p>
          ) : null}
        </div>
      </ConfirmDialog>
    </div>
  );
}
