import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Field, TextInput } from '../components/ui/Primitives.jsx';
import PasswordInput from '../components/ui/PasswordInput.jsx';
import { ApiError } from '../services/api.js';
import { getTemplate } from '../utils/templates.js';

const rules = [
  { id: 'length', label: '8+ characters', test: (value) => value.length >= 8 },
  { id: 'letter', label: 'A letter', test: (value) => /[a-zA-Z]/.test(value) },
  { id: 'number', label: 'A number', test: (value) => /[0-9]/.test(value) },
];

export default function Register() {
  const { user, register, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const template = params.get('template');
  const templateMeta = template ? getTemplate(template) : null;

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const checks = useMemo(() => rules.map((rule) => ({ ...rule, passed: rule.test(form.password) })), [form.password]);
  const passwordsMatch = form.confirm.length > 0 && form.confirm === form.password;

  if (!loading && user && !justRegistered) {
    return <Navigate to={template ? `/dashboard/builder?template=${encodeURIComponent(template)}` : '/dashboard'} replace />;
  }

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
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name (at least 2 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!checks.every((check) => check.passed)) nextErrors.password = 'Use at least 8 characters with a letter and a number.';
    if (form.confirm !== form.password) nextErrors.confirm = 'Passwords do not match.';
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      setError('Check the highlighted fields and try again.');
      return;
    }

    setSubmitting(true);
    setJustRegistered(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(template ? `/dashboard/builder?template=${encodeURIComponent(template)}` : '/dashboard', { replace: true });
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
    <div className="rounded-lg border border-line bg-white p-6 sm:p-7">
      <div className="mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-canvasAlt text-accent-hover">
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-ink">Create your account</h2>
        <p className="mt-1.5 text-sm text-muted">
          Create an account, build a portfolio and publish it to a public link. No payment details are requested.
        </p>
        {templateMeta ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent-line/60 bg-accent-soft px-3 py-1 text-[11px] font-medium text-accent-hover">
            <Check size={11} aria-hidden="true" />
            {templateMeta.name} will be applied after sign-up
          </p>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-dangerSoft p-3 text-xs leading-relaxed text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
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
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            aria-describedby="password-rules"
          />
        </Field>

        <div id="password-rules" className="flex flex-wrap gap-x-4 gap-y-1.5">
          {checks.map((check) => (
            <span
              key={check.id}
              className={`inline-flex items-center gap-1 text-[11px] ${check.passed ? 'text-success' : 'text-faint'}`}
            >
              {check.passed ? <Check size={11} aria-hidden="true" /> : <X size={11} aria-hidden="true" />}
              {check.label}
            </span>
          ))}
        </div>

        <Field label="Confirm password" htmlFor="confirm" required error={fieldErrors.confirm}>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            value={form.confirm}
            onChange={update('confirm')}
            aria-invalid={Boolean(fieldErrors.confirm)}
          />
        </Field>
        {form.confirm && !passwordsMatch ? <p className="-mt-2 text-xs text-danger">Passwords do not match yet.</p> : null}

        <p className="text-[11px] leading-relaxed text-faint">
          By creating an account you agree to the{' '}
          <Link to="/terms" className="text-inkSoft underline underline-offset-2 hover:text-ink">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-inkSoft underline underline-offset-2 hover:text-ink">
            privacy policy
          </Link>
          .
        </p>

        <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={submitting}>
          <span>Create account</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent-hover hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
