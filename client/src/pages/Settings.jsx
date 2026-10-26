import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Palette,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { PageHeader } from '../components/ui/Kit.jsx';
import { Alert, Button, Field, TextInput } from '../components/ui/Primitives.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authService } from '../services/authService.js';
import { formatDate } from '../utils/format.js';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'Contains a letter', test: (value) => /[a-zA-Z]/.test(value) },
  { label: 'Contains a number', test: (value) => /[0-9]/.test(value) },
];

const NOTIFICATION_ROWS = [
  { id: 'publish', label: 'Portfolio publishing', description: 'Confirmations when a portfolio goes live or is unpublished.', defaultOn: true },
  { id: 'analyzer', label: 'Analyser results', description: 'A summary after each portfolio analysis run.', defaultOn: true },
  { id: 'ai', label: 'AI availability', description: 'Warnings when AI features are unavailable and downgrade to rule-based output.', defaultOn: true },
  { id: 'product', label: 'Product updates', description: 'Occasional notes about new templates and features.', defaultOn: false },
];

export default function Settings() {
  const { user, refresh, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: '', headline: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('portiai-notifications') || 'null') || Object.fromEntries(NOTIFICATION_ROWS.map((row) => [row.id, row.defaultOn]));
    } catch {
      return Object.fromEntries(NOTIFICATION_ROWS.map((row) => [row.id, row.defaultOn]));
    }
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', headline: user.headline || '' });
  }, [user]);

  useEffect(() => {
    localStorage.setItem('portiai-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const passwordChecks = useMemo(() => PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(passwords.newPassword) })), [passwords.newPassword]);
  const passwordValid = passwordChecks.every((rule) => rule.passed) && passwords.newPassword === passwords.confirm;

  const profileDirty = user && (profile.name.trim() !== (user.name || '') || profile.headline.trim() !== (user.headline || ''));

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError('');
    if (profile.name.trim().length < 2) {
      setProfileError('Please enter your full name (at least 2 characters).');
      return;
    }
    setSavingProfile(true);
    try {
      await authService.updateAccount({ name: profile.name.trim(), headline: profile.headline.trim() });
      await refresh();
      toast.success('Profile updated.');
    } catch (error) {
      setProfileError(error.message || 'Could not update your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (!passwords.currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    if (!passwordValid) {
      setPasswordError(
        passwords.newPassword !== passwords.confirm ? 'The new passwords do not match.' : 'Your new password does not meet the requirements below.'
      );
      return;
    }
    setSavingPassword(true);
    try {
      await authService.updateAccount({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed.', { description: 'Other devices have been signed out.' });
    } catch (error) {
      setPasswordError(error.message || 'Could not change your password.');
    } finally {
      setSavingPassword(false);
    }
  };


  const toggleNotification = (id) => {
    setNotifications((current) => ({ ...current, [id]: !current[id] }));
  };

  const deleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm deletion.');
      return;
    }
    setDeleting(true);
    try {
      await authService.deleteAccount(deletePassword);
      toast.success('Account deleted.');
      await logout().catch(() => {});
      navigate('/', { replace: true });
    } catch (error) {
      setDeleteError(error.message || 'Could not delete your account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Account and preferences"
        description="Manage your PortiAI profile, password and local preferences. Appearance and notification choices are stored in this browser."
        actions={
          <Link to="/dashboard" className="btn-secondary btn-sm">
            Back to dashboard
          </Link>
        }
      />

      {/* Profile */}
      <form onSubmit={saveProfile} className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-accent-hover">
            <User size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Profile</h2>
            <p className="mt-0.5 text-xs text-muted">Your display name appears in the dashboard. Your email is used to sign in.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="settings-name" required>
            <TextInput
              id="settings-name"
              value={profile.name}
              maxLength={80}
              autoComplete="name"
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field label="Headline" htmlFor="settings-headline" hint="Shown beside your name, e.g. “Frontend developer”.">
            <TextInput
              id="settings-headline"
              value={profile.headline}
              maxLength={120}
              placeholder="Frontend developer"
              onChange={(event) => setProfile((current) => ({ ...current, headline: event.target.value }))}
            />
          </Field>
          <Field label="Email" htmlFor="settings-email" hint="Email changes are not supported yet — contact support to change it.">
            <TextInput id="settings-email" value={user?.email || ''} readOnly disabled />
          </Field>
          <Field label="Member since" htmlFor="settings-created">
            <TextInput id="settings-created" value={formatDate(user?.createdAt)} readOnly disabled />
          </Field>
        </div>

        {profileError ? (
          <p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-dangerSoft px-3 py-2 text-xs text-danger">
            {profileError}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-faint">{profileDirty ? 'You have unsaved profile changes.' : 'Profile is up to date.'}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!profileDirty || savingProfile}
              onClick={() => setProfile({ name: user?.name || '', headline: user?.headline || '' })}
            >
              Reset
            </Button>
            <Button type="submit" size="sm" loading={savingProfile} disabled={!profileDirty || savingProfile}>
              <Check size={13} aria-hidden="true" />
              Save profile
            </Button>
          </div>
        </div>
      </form>

      {/* Password */}
      <form onSubmit={savePassword} className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-accent-hover">
            <KeyRound size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Password</h2>
            <p className="mt-0.5 text-xs text-muted">Changing your password signs out every other device.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Current password" htmlFor="current-password" required>
            <TextInput
              id="current-password"
              type={showPasswords ? 'text' : 'password'}
              value={passwords.currentPassword}
              autoComplete="current-password"
              onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
            />
          </Field>
          <Field label="New password" htmlFor="new-password" required>
            <TextInput
              id="new-password"
              type={showPasswords ? 'text' : 'password'}
              value={passwords.newPassword}
              autoComplete="new-password"
              onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
            />
          </Field>
          <Field
            label="Confirm new password"
            htmlFor="confirm-password"
            required
            error={passwords.confirm && passwords.confirm !== passwords.newPassword ? 'Passwords do not match.' : undefined}
          >
            <TextInput
              id="confirm-password"
              type={showPasswords ? 'text' : 'password'}
              value={passwords.confirm}
              autoComplete="new-password"
              onChange={(event) => setPasswords((current) => ({ ...current, confirm: event.target.value }))}
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => setShowPasswords((value) => !value)}
            className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-ink"
          >
            {showPasswords ? <EyeOff size={12} aria-hidden="true" /> : <Eye size={12} aria-hidden="true" />}
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </button>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {passwordChecks.map((rule) => (
              <li key={rule.label} className={`inline-flex items-center gap-1 text-[11px] ${rule.passed ? 'text-success' : 'text-faint'}`}>
                <Check size={10} aria-hidden="true" className={rule.passed ? '' : 'opacity-30'} />
                {rule.label}
              </li>
            ))}
          </ul>
        </div>

        {passwordError ? (
          <p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-dangerSoft px-3 py-2 text-xs text-danger">
            {passwordError}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <Button type="submit" size="sm" loading={savingPassword} disabled={savingPassword || !passwords.currentPassword || !passwords.newPassword}>
            <ShieldCheck size={13} aria-hidden="true" />
            Change password
          </Button>
        </div>
      </form>

      {/* Appearance */}
      <div className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-accent-hover">
            <Palette size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Appearance</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted">
              PortiAI uses a single dark interface, so there is no dashboard theme to choose. The look of your
              public portfolio — template, accent colour, font and section order — is set per portfolio in the
              editor.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link to="/dashboard/templates" className="btn-secondary btn-sm">
            Browse templates
          </Link>
          <Link to="/dashboard/portfolios" className="btn-ghost btn-sm">
            Open a portfolio to change its design
          </Link>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-canvas text-accent-hover">
            <Bell size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Notifications</h2>
            <p className="mt-0.5 text-xs text-muted">
              PortiAI does not send email or push notifications yet. These preferences store your intent locally and are used for
              in-app toasts.
            </p>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {NOTIFICATION_ROWS.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-xs font-medium text-ink">{row.label}</p>
                <p className="mt-0.5 text-[11px] text-muted">{row.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(notifications[row.id])}
                aria-label={row.label}
                onClick={() => toggleNotification(row.id)}
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
                  notifications[row.id] ? 'bg-accent' : 'bg-canvasAlt'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow transition-transform ${
                    notifications[row.id] ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Account / danger */}
      <div className="card border-danger/25 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-danger/25 bg-dangerSoft text-danger">
            <AlertTriangle size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Danger zone</h2>
            <p className="mt-0.5 text-xs text-muted">
              Deleting your account permanently removes every portfolio, blog post and analysis result. Published links stop
              working immediately. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-[11px] text-faint">
            <Sparkles size={11} aria-hidden="true" />
            Prefer a break? You can simply log out — your work stays saved.
          </p>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={13} aria-hidden="true" />
            Delete account
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletePassword('');
          setDeleteError('');
        }}
        onConfirm={deleteAccount}
        busy={deleting}
        title="Delete your PortiAI account?"
        description="Every portfolio, blog post and analysis will be deleted permanently and published links will stop working. Enter your password to confirm."
        confirmLabel="Delete my account"
      >
        <div className="mt-3 space-y-2">
          <Field label="Password" htmlFor="delete-password" required>
            <TextInput
              id="delete-password"
              type="password"
              value={deletePassword}
              autoComplete="current-password"
              onChange={(event) => setDeletePassword(event.target.value)}
            />
          </Field>
          {deleteError ? (
            <p role="alert" className="text-xs text-danger">
              {deleteError}
            </p>
          ) : null}
        </div>
      </ConfirmDialog>

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30">
          <Loader2 size={22} className="animate-spin text-accent-hover" aria-hidden="true" />
          <span className="sr-only">Deleting account</span>
        </div>
      ) : null}

      {!user ? <Alert tone="warning" title="You are signed out">Sign in again to manage your account.</Alert> : null}
    </div>
  );
}
