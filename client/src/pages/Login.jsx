import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
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
    <div className="card p-5 sm:p-6">
      <h2 className="text-xl">Sign in</h2>
      <p className="mt-1 text-sm text-muted">Welcome back. Your portfolios are waiting.</p>

      {error ? (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded border border-danger/25 bg-dangerSoft px-3 py-2.5 text-sm text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
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

        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-xs text-accent hover:underline">
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" className="w-full py-2" loading={submitting} disabled={submitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-5 border-t border-line pt-4 text-sm text-inkSoft">
        New to PortiAI?{' '}
        <Link to="/register" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
