import { Link } from 'react-router-dom';
import { MailX, KeyRound, ArrowRight } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div className="card p-6 sm:p-8 bg-surface shadow-raised border-line">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 ring-1 ring-amber-100">
        <MailX size={18} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink">Password recovery is not enabled</h2>

      <div className="mt-3.5 space-y-3 text-xs leading-relaxed text-inkSoft">
        <p>
          Resetting a password via email requires a third-party transactional email service (e.g. Resend, SendGrid) and
          a verified sending domain. To keep this deployment strictly on zero-cost free tiers with zero hidden setup,
          no email credentials are required.
        </p>
        <p>
          <strong className="text-ink font-semibold">Active account access:</strong> Sign in with your registered
          password, and change it anytime from{' '}
          <strong className="text-ink font-semibold">Dashboard → Account Settings</strong>.
        </p>
        <p>
          <strong className="text-ink font-semibold">Demo reset:</strong> For academic evaluators who forgot a password,
          an administrator can update the bcrypt hash directly in MongoDB Atlas or register a new demonstration account.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Link to="/login" className="btn-primary">
          <KeyRound size={14} aria-hidden="true" />
          <span>Back to sign in</span>
        </Link>
        <Link to="/register" className="btn-secondary">
          <span>Create new account</span>
        </Link>
      </div>
    </div>
  );
}
