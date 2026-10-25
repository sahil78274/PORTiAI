import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
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
  const [submittingNow, setSubmittingNow] = useState(false);

  const next = params.get('next') || location.state?.from || '/dashboard';

  if (!loading && user && !submittingNow) return <Navigate to={next} replace />;

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to continue.');
      return;
    }

    setSubmitting(true);
    setSubmittingNow(true);
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
    <div className="card p-6 sm:p-8 bg-surface shadow-raised border-line">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h2>
        <p className="mt-1.5 text-xs text-muted">Sign in to your account to edit and manage your portfolios.</p>
      </div>

      {error ? (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" required error={fieldErrors.email}>
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
          <PasswordInput id="password" name="password" value={form.password} onChange={update('password')} />
        </Field>

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full mt-2" loading={submitting} disabled={submitting}>
          <span>Sign In</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-4 text-center text-xs text-inkSoft">
        Don&apos;t have an account yet?{' '}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
