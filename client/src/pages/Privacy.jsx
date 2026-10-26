import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Database, Eye, Lock, Sparkles, Trash2 } from 'lucide-react';

const SECTIONS = [
  {
    id: 'stored',
    title: 'What is stored',
    icon: Database,
    body: (
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>Your name, email address and a bcrypt hash of your password. The plain password is never stored or logged.</li>
        <li>Portfolio content you enter: profile details, skills, education, projects, experience, achievements, links and design preferences.</li>
        <li>Blog posts you create, including drafts, and their publish status.</li>
        <li>Saved analysis results, the template you selected, publish status and timestamps.</li>
        <li>A daily counter of AI requests, used to enforce the per-account usage cap.</li>
      </ul>
    ),
  },
  {
    id: 'sessions',
    title: 'Sessions and security',
    icon: Lock,
    body: (
      <p className="mt-2">
        Signing in issues a signed JSON Web Token in an HTTP-only cookie, so JavaScript cannot read it. Signing out increments a
        per-account token version on the server, which invalidates existing cookies on other devices. Passwords are hashed with
        bcrypt; no plain-text credential is ever stored.
      </p>
    ),
  },
  {
    id: 'public',
    title: 'What becomes public',
    icon: Eye,
    body: (
      <p className="mt-2">
        Only portfolios you explicitly publish are served at{' '}
        <code className="rounded border border-line bg-canvasAlt px-1 py-0.5 font-mono text-xs">/p/&lt;slug&gt;</code>.
        Published blog posts appear at{' '}
        <code className="rounded border border-line bg-canvasAlt px-1 py-0.5 font-mono text-xs">/p/&lt;slug&gt;/blog</code>{' '}
        on the same basis. The public response contains portfolio and post content only — never your account id, account email,
        analysis results or private metadata. Your contact email appears publicly only if you type it into the portfolio&apos;s
        contact field yourself. Unpublishing removes public access immediately.
      </p>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party services',
    icon: Sparkles,
    body: (
      <p className="mt-2">
        When you use an AI feature, only the facts relevant to that request (for example a project description and your listed
        technologies) are sent to Google&apos;s Gemini API through our backend. API keys stay on the server. When you scan a URL
        with the website analyser, the server fetches that public page to inspect its HTML; private and internal addresses are
        blocked. Hosting providers (Vercel, Render, MongoDB Atlas) process data as part of running the application.
      </p>
    ),
  },
  {
    id: 'storage',
    title: 'Local storage',
    icon: Database,
    body: (
      <p className="mt-2">
        The dashboard stores interface preferences in your browser&apos;s local storage (sidebar state, notification toggles and
        appearance preference). This data never leaves your device. One functional cookie is used for the session; there is no
        advertising, analytics or tracking cookie in this build.
      </p>
    ),
  },
  {
    id: 'removal',
    title: 'Data removal',
    icon: Trash2,
    body: (
      <p className="mt-2">
        Deleting your account in <Link to="/dashboard/settings" className="text-accent-hover underline-offset-2 hover:underline">Settings</Link>{' '}
        removes your user record, every portfolio you own and every blog post attached to them. Deletion is immediate and cannot
        be undone from inside the application.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="container-wide max-w-3xl py-14">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
        <ArrowLeft size={13} aria-hidden="true" />
        Back to home
      </Link>
      <p className="eyebrow mt-6">Privacy</p>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] text-ink sm:text-[36px]">Privacy information</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        A plain-language description of what PortiAI stores, what it publishes and who else processes your data. Last updated{' '}
        {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.
      </p>

      <div className="mt-5 flex gap-3 rounded-xl border border-warning/25 bg-warningSoft px-4 py-3 text-xs leading-relaxed text-warning">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          This document is written for an independent project rather than by a legal team. It accurately describes how this build
          behaves, but it is not legal advice. If you plan to process personal data at scale, have a qualified person review it.
        </p>
      </div>

      <div className="mt-9 space-y-8">
        {SECTIONS.map(({ id, title, icon: Icon, body }) => (
          <section key={id} id={id} className="scroll-mt-24">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Icon size={15} className="text-accent-hover" aria-hidden="true" />
              {title}
            </h2>
            <div className="text-sm leading-7 text-inkSoft">{body}</div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6 text-xs text-muted">
        <Link to="/terms" className="btn-secondary btn-sm">
          Terms of use
        </Link>
        <Link to="/#faq" className="btn-ghost btn-sm">
          Read the FAQ
        </Link>
      </div>
    </div>
  );
}
