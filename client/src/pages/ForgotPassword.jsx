import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, KeyRound, MailCheck, Settings } from 'lucide-react';
import { Field, TextInput } from '../components/ui/Primitives.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Enter the email address you signed up with.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <div className="rounded-lg border border-line bg-surface p-6 sm:p-7">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-warning/25 bg-warningSoft text-warning">
        <KeyRound size={18} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-ink">Reset your password</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        Automated reset emails are not enabled in this deployment. Here is what you can do instead.
      </p>

      {!submitted ? (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label="Account email" htmlFor="reset-email" error={error} hint="Used only to confirm which account you mean — nothing is sent.">
            <TextInput
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError('');
              }}
              aria-invalid={Boolean(error)}
            />
          </Field>

          <button type="submit" className="btn-primary w-full justify-center">
            Continue
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warningSoft p-3.5 text-xs leading-relaxed text-warning">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">No reset email will arrive.</p>
              <p className="mt-1">
                PortiAI has no transactional email provider configured, so it cannot securely verify ownership of{' '}
                <strong className="font-semibold">{email.trim()}</strong> by email. Sending a “reset link” that does
                nothing would be misleading.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 rounded-lg border border-line bg-canvas p-4 text-xs leading-relaxed text-inkSoft">
            <p className="flex items-start gap-2">
              <Settings size={14} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden="true" />
              <span>
                <strong className="text-ink">Still signed in somewhere?</strong> Open{' '}
                <strong className="text-ink">Settings → Password</strong> to change it with your current password.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <MailCheck size={14} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden="true" />
              <span>
                <strong className="text-ink">Locked out?</strong> Contact the deployment operator to reset your
                credentials directly, or create a new account with a different email address.
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Link to="/login" className="btn-secondary btn-sm">
          Back to sign in
        </Link>
        <Link to="/signup" className="btn-ghost btn-sm">
          Create a new account
        </Link>
      </div>
    </div>
  );
}
