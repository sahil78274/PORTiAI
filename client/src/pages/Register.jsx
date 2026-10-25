import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Field, TextInput } from '../components/ui/Primitives.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import { ApiError } from '../services/api.js';

const rules = [
  { id: 'length', label: '8+ characters', test: (value) => value.length >= 8 },
  { id: 'letter', label: 'Includes letter', test: (value) => /[a-zA-Z]/.test(value) },
  { id: 'number', label: 'Includes number', test: (value) => /[0-9]/.test(value) },
];

export default function Register() {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const template = params.get('template');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  // While the registration request is in flight the auth context already holds a
  // user, so suppress the "already signed in" redirect and let this handler
  // decide where to go (the wizard, carrying the chosen template through).
  const [justRegistered, setJustRegistered] = useState(false);

  const checks = useMemo(() => rules.map((rule) => ({ ...rule, passed: rule.test(form.password) })), [form.password]);

  if (!loading && user && !justRegistered) {
    return <Navigate to={template ? `/dashboard/create?template=${encodeURIComponent(template)}` : '/dashboard'} replace />;
  }

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Fill in your name, email and password.');
      return;
    }
    if (!checks.every((check) => check.passed)) {
      setError('Your password does not meet all security requirements.');
      return;
    }

    setSubmitting(true);
    setJustRegistered(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(template ? `/dashboard/create?template=${encodeURIComponent(template)}` : '/dashboard/create', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setFieldErrors(Object.fromEntries(err.details.map((detail) => [detail.field, detail.message])));
      }
      setError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8 bg-surface shadow-raised border-line">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink">Create your account</h2>
        <p className="mt-1.5 text-xs text-muted">
          Free academic workspace.
          {template ? ` Selected template (${template}) will be applied automatically.` : ''}
        </p>
      </div>

      {error ? (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" required error={fieldErrors.name}>
          <TextInput
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Aarav Mehta"
            value={form.name}
            onChange={update('name')}
            aria-invalid={Boolean(fieldErrors.name)}
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={fieldErrors.email} hint="Used for signing in and account access.">
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
          <PasswordInput id="password" name="password" autoComplete="new-password" value={form.password} onChange={update('password')} />
        </Field>

        <ul className="grid grid-cols-3 gap-2 py-1">
          {checks.map((check) => (
            <li
              key={check.id}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs font-medium transition-colors ${
                check.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
              }`}
            >
              {check.passed ? (
                <Check size={11} strokeWidth={2.5} className="text-emerald-600" aria-hidden="true" />
              ) : (
                <X size={11} className="text-slate-400" aria-hidden="true" />
              )}
              <span>{check.label}</span>
            </li>
          ))}
        </ul>

        <Button type="submit" size="lg" className="w-full mt-2" loading={submitting} disabled={submitting}>
          <span>Create Workspace</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Button>

        <p className="text-2xs leading-relaxed text-slate-400 text-center pt-2">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="text-accent hover:underline">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-accent hover:underline">
            privacy notice
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 border-t border-line pt-4 text-center text-xs text-inkSoft">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
