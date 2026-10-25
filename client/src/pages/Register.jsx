import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Field, TextInput } from '../components/ui/Primitives.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import { ApiError } from '../services/api.js';

const rules = [
  { id: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'letter', label: 'Contains a letter', test: (value) => /[a-zA-Z]/.test(value) },
  { id: 'number', label: 'Contains a number', test: (value) => /[0-9]/.test(value) },
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

  if (!loading && user && !justRegistered) return <Navigate to="/dashboard" replace />;

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
      setError('Your password does not meet all the requirements listed below.');
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
    <div className="card p-5 sm:p-6">
      <h2 className="text-xl">Create your account</h2>
      <p className="mt-1 text-sm text-muted">
        Free to use. You can build several portfolios from one account.
        {template ? ' The template you picked will be preselected.' : ''}
      </p>

      {error ? (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded border border-danger/25 bg-dangerSoft px-3 py-2.5 text-sm text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
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

        <Field label="Email" htmlFor="email" required error={fieldErrors.email} hint="Used for signing in. No marketing email is sent.">
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

        <ul className="grid gap-1 sm:grid-cols-3">
          {checks.map((check) => (
            <li key={check.id} className={`inline-flex items-center gap-1 text-xs ${check.passed ? 'text-success' : 'text-muted'}`}>
              {check.passed ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
              {check.label}
            </li>
          ))}
        </ul>

        <Button type="submit" className="w-full py-2" loading={submitting} disabled={submitting}>
          Create account
        </Button>

        <p className="text-xs leading-5 text-muted">
          By creating an account you agree to the{' '}
          <Link to="/terms" className="text-accent hover:underline">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-accent hover:underline">
            privacy information
          </Link>{' '}
          for this academic project.
        </p>
      </form>

      <p className="mt-5 border-t border-line pt-4 text-sm text-inkSoft">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
