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
      setPasswordDone('Password updated. Other devices have been signed out.');
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
    <div className="max-w-3xl">
      <h1 className="text-2xl">Account settings</h1>
      <p className="mt-1 text-sm text-muted">
        Signed in as {user?.email} · account created {formatDate(user?.createdAt)}
      </p>

      <section className="card mt-5 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <User size={16} className="text-accent" aria-hidden="true" /> Profile
        </h2>
        <p className="mt-1 text-sm text-muted">Your name is used as the default name on new portfolios.</p>

        {profileError ? (
          <Alert tone="error" className="mt-3">
            {profileError}
          </Alert>
        ) : null}

        <form onSubmit={saveProfile} className="mt-4 space-y-3" noValidate>
          <Field label="Full name" htmlFor="settings-name" required>
            <TextInput
              id="settings-name"
              value={profile.name}
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              maxLength={80}
              autoComplete="name"
            />
          </Field>
          <Field label="Headline" htmlFor="settings-headline" hint="Optional. Shown on your dashboard, e.g. “BCA final year”.">
            <TextInput
              id="settings-headline"
              value={profile.headline}
              onChange={(event) => setProfile({ ...profile, headline: event.target.value })}
              maxLength={120}
            />
          </Field>
          <Field label="Email" htmlFor="settings-email" hint="Email changes are not supported in this build.">
            <TextInput id="settings-email" value={user?.email || ''} disabled readOnly />
          </Field>
          <Button type="submit" loading={profileSaving}>
            <Check size={14} aria-hidden="true" /> Save changes
          </Button>
        </form>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <KeyRound size={16} className="text-accent" aria-hidden="true" /> Password
        </h2>
        <p className="mt-1 text-sm text-muted">
          Changing your password signs out every other device using your account.
        </p>

        {passwordError ? (
          <Alert tone="error" className="mt-3">
            {passwordError}
          </Alert>
        ) : null}
        {passwordDone ? (
          <Alert tone="success" className="mt-3">
            {passwordDone}
          </Alert>
        ) : null}

        <form onSubmit={savePassword} className="mt-4 space-y-3" noValidate>
          <Field label="Current password" htmlFor="current-password" required>
            <PasswordInput
              id="current-password"
              value={passwords.currentPassword}
              onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
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
            Update password
          </Button>
        </form>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="flex items-center gap-2 text-lg">
          <Sparkles size={16} className="text-accent" aria-hidden="true" /> AI usage
        </h2>
        <p className="mt-1 text-sm text-muted">
          AI features run on the Gemini free tier. The backend enforces a per-account daily cap so one account cannot
          exhaust the shared quota.
        </p>
        {aiStatus ? (
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded border border-line bg-canvasAlt/60 px-3 py-2">
              <p className="text-2xs uppercase tracking-wide text-muted">Status</p>
              <p className="mt-0.5 text-ink">{aiStatus.configured ? 'Configured' : 'Not configured'}</p>
            </div>
            <div className="rounded border border-line bg-canvasAlt/60 px-3 py-2">
              <p className="text-2xs uppercase tracking-wide text-muted">Requests today</p>
              <p className="mt-0.5 tabular-nums text-ink">
                {aiStatus.usage?.used ?? 0} / {aiStatus.usage?.limit ?? '—'}
              </p>
            </div>
            <div className="rounded border border-line bg-canvasAlt/60 px-3 py-2">
              <p className="text-2xs uppercase tracking-wide text-muted">Fallback</p>
              <p className="mt-0.5 text-ink">Rule-based analysis</p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">AI status could not be loaded right now.</p>
        )}
        <p className="mt-3 text-xs text-muted">
          Read the{' '}
          <Link to="/privacy" className="text-accent hover:underline">
            privacy information
          </Link>{' '}
          for what is sent to the AI provider.
        </p>
      </section>

      <section className="card mt-4 border-danger/25 p-5">
        <h2 className="flex items-center gap-2 text-lg text-danger">
          <ShieldAlert size={16} aria-hidden="true" /> Delete account
        </h2>
        <p className="mt-1 text-sm text-muted">
          Deleting your account permanently removes your user record and every portfolio you own, including published
          links. This cannot be undone.
        </p>
        <Button variant="danger" className="mt-3" onClick={() => setDeleteOpen(true)}>
          <Trash2 size={14} aria-hidden="true" /> Delete my account
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
        title="Delete your account?"
        description="This removes your account and all portfolios permanently. Enter your password to confirm."
        confirmLabel="Delete account permanently"
      >
        <div className="mt-3">
          <Field label="Password" htmlFor="delete-password" required error={deleteError}>
            <PasswordInput
              id="delete-password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
            />
          </Field>
          {deleteError ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
              <AlertCircle size={12} aria-hidden="true" /> {deleteError}
            </p>
          ) : null}
        </div>
      </ConfirmDialog>
    </div>
  );
}
