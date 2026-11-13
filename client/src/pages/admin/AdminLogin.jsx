import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Field, TextInput } from '../../components/ui/Primitives.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import { ApiError } from '../../services/api.js';
import { adminService } from '../../services/adminService.js';
import { ADMIN_DASHBOARD_PATH } from '../../utils/adminAccess.js';

/**
 * Dedicated administrator sign-in. Uses the same email + password
 * experience as the normal login, but only administrator accounts are
 * accepted — a valid non-admin credential is rejected by the server.
 */
export default function AdminLogin() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const requestedNext = params.get('next') || location.state?.from || ADMIN_DASHBOARD_PATH;
  // Keep the post-login redirect inside the admin area; never treat a query
  // parameter as an arbitrary external destination.
  const next = requestedNext.startsWith('/admin/') && !requestedNext.startsWith('//')
    ? requestedNext
    : ADMIN_DASHBOARD_PATH;

  if (!loading && user?.isAdmin) return <Navigate to={next} replace />;

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!form.password) nextErrors.password = 'Enter your password.';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setError('Check the highlighted fields and try again.');
      return;
    }

    setSubmitting(true);
    try {
      await adminService.login({ email: form.email.trim(), password: form.password });
      await refresh();
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('This account does not have administrator access. Sign in with an administrator email instead.');
      } else if (err instanceof ApiError && err.details?.length) {
        setFieldErrors(Object.fromEntries(err.details.map((detail) => [detail.field, detail.message])));
        setError(err.message || 'Could not sign in. Please try again.');
      } else {
        setError(err.message || 'Could not sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface p-6 sm:p-7">
      <div className="mb-7">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent-line bg-accent-soft text-accent-hover">
          <ShieldCheck size={18} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-ink">Admin sign in</h2>
        <p className="mt-1.5 text-sm text-muted">Sign in with an administrator email and password to manage PortiAI.</p>
      </div>

      {error ? (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-dangerLine bg-dangerSoft p-3 text-xs leading-relaxed text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {user && !user.isAdmin ? (
        <div role="status" className="mb-5 rounded-lg border border-warningLine bg-warningSoft p-3 text-xs leading-relaxed text-warning">
          You are signed in as a regular user. Admin pages are restricted to administrator accounts.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Administrator email" htmlFor="admin-email" required error={fieldErrors.email}>
          <TextInput
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={update('email')}
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </Field>

        <Field label="Password" htmlFor="admin-password" required error={fieldErrors.password}>
          <PasswordInput id="admin-password" name="password" value={form.password} onChange={update('password')} />
        </Field>

        <Button type="submit" size="lg" className="mt-1 w-full" loading={submitting} disabled={submitting}>
          <span>Sign in as admin</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-5 rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-[11px] leading-relaxed text-faint">
        There is no public admin registration. Administrator accounts are provisioned by the operator with a secure
        one-time script — see the admin documentation.
      </p>

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        Not an administrator?{' '}
        <Link to="/login" className="font-semibold text-accent-hover hover:underline">
          Sign in as a user
        </Link>
      </p>
    </div>
  );
}
