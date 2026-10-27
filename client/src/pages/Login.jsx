import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Field, TextInput } from '../components/ui/Primitives.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import { ApiError } from '../services/api.js';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const next = params.get('next') || location.state?.from || '/dashboard';

  if (!loading && user && !justSubmitted) return <Navigate to={next} replace />;

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
    setJustSubmitted(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setFieldErrors(Object.fromEntries(err.details.map((detail) => [detail.field, detail.message])));
      }
      setError(err.message || 'Could not sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[24px] bg-surface p-6 shadow-neu-lg sm:p-8">
      <div className="mb-7">
        <span className="icon-tile h-12 w-12">
          <LockKeyhole size={18} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-[24px] font-bold tracking-[-0.025em] text-ink">Welcome back</h2>
        <p className="mt-1.5 text-sm text-muted">Sign in to keep building, editing and publishing your portfolios.</p>
      </div>

      {error ? (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-tile bg-dangerSoft p-3 text-xs font-medium leading-relaxed text-danger shadow-neu-inset-xs">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Email address" htmlFor="email" required error={fieldErrors.email}>
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </Field>

        <Field label="Password" htmlFor="password" required error={fieldErrors.password}>
          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={update('password')}
            aria-invalid={Boolean(fieldErrors.password)}
          />
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="remember" defaultChecked className="checkbox" />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="text-xs font-medium text-accent-hover hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="mt-1 w-full" loading={submitting} disabled={submitting}>
          <span>Sign In</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-5 rounded-tile bg-canvas px-3.5 py-2.5 text-[11px] leading-relaxed text-faint shadow-neu-inset-xs">
        Email and password sign-in only. Google and GitHub OAuth are not connected to this deployment yet, so they are
        intentionally not shown here.
      </p>

      <p className="mt-7 border-t border-line pt-5 text-center text-sm text-muted">
        New to PortiAI?{' '}
        <Link to="/signup" className="font-semibold text-accent-hover hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
