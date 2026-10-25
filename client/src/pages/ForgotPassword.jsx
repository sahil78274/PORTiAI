import { Link } from 'react-router-dom';
import { MailX, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  return (
    <div className="card p-5 sm:p-6">
      <span className="flex h-9 w-9 items-center justify-center rounded border border-warning/25 bg-warningSoft text-warning">
        <MailX size={16} aria-hidden="true" />
      </span>
      <h2 className="mt-3 text-xl">Password recovery is not enabled</h2>

      <div className="mt-3 space-y-3 text-sm leading-6 text-inkSoft">
        <p>
          Resetting a password by email requires a transactional email provider (for example Resend, SendGrid or SMTP
          credentials) and a verified sending domain. Neither is configured in this build, so PortiAI will not pretend
          to send a reset email that never arrives.
        </p>
        <p>
          <span className="font-medium text-ink">What works today:</span> sign in with the password you registered with,
          and change it from{' '}
          <span className="font-medium text-ink">Dashboard → Settings → Password</span>. Changing your password signs out
          your other devices.
        </p>
        <p>
          <span className="font-medium text-ink">For the project demo:</span> if you have lost the password for a
          demonstration account, an administrator can reset it directly in MongoDB Atlas. See the README section
          “Password recovery” for the documented procedure.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Link to="/login" className="btn-primary">
          <KeyRound size={14} aria-hidden="true" /> Back to sign in
        </Link>
        <Link to="/register" className="btn-ghost">
          Create a new account
        </Link>
      </div>
    </div>
  );
}
