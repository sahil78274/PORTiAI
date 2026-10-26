import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    id: 'service',
    title: 'Using the service',
    body: (
      <p>
        PortiAI helps you build, review and publish a personal portfolio and optional blog. You are responsible for the accuracy
        of everything you publish and for having the right to use the content and images you upload or link to. Do not publish
        content that is unlawful, misleading or impersonates another person.
      </p>
    ),
  },
  {
    id: 'ai-output',
    title: 'AI-assisted suggestions',
    body: (
      <p>
        AI output is a suggestion, not a verified statement of fact. The application constrains the model to the facts you
        supply and instructs it not to invent qualifications or outcomes, but you must review generated text before publishing.
        AI features may be unavailable at any time; the product degrades to rule-based behaviour and says so on screen.
      </p>
    ),
  },
  {
    id: 'analyzer',
    title: 'Analyzer scores',
    body: (
      <p>
        Portfolio scores come from a documented, deterministic rubric and measure content quality signals such as completeness,
        specificity, contactability and readability. They are not a prediction of employment outcomes, and the website scanner
        evaluates only the HTML it receives — external stylesheets and JavaScript-rendered content are not executed.
      </p>
    ),
  },
  {
    id: 'content',
    title: 'Your content and public links',
    body: (
      <p>
        You keep ownership of the content you create. By publishing a portfolio you grant PortiAI permission to serve that
        content at its public URL for as long as the portfolio remains published. Unpublishing stops public access immediately;
        deleting the portfolio or your account removes the content permanently.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts',
    body: (
      <p>
        One person should hold one account. Keep your password safe — account email changes and password recovery emails are not
        implemented yet, so a lost password currently requires a new account. You can delete your account and all its data from
        Settings at any time.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and limits',
    body: (
      <p>
        The service runs on free-tier infrastructure. It may be slow after idle periods, may be offline, and enforces rate limits
        on authentication, AI and scanning endpoints. No uptime, data-retention or support guarantee is offered. Keep your own
        copy of anything important.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Liability',
    body: (
      <p>
        The software is provided &quot;as is&quot;, without warranties of any kind. The maintainers are not liable for any loss
        arising from its use, including loss of portfolio content or interruption of a public link.
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <div className="container-wide max-w-3xl py-14">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink">
        <ArrowLeft size={13} aria-hidden="true" />
        Back to home
      </Link>
      <p className="eyebrow mt-6">Terms</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Terms of use</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        The rules for using PortiAI, written plainly. Last updated{' '}
        {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.
      </p>

      <div className="mt-5 flex gap-3 rounded-xl border border-warning/25 bg-warningSoft px-4 py-3 text-xs leading-relaxed text-warning">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          These terms describe how this independent project behaves. They have not been reviewed by a lawyer and are not a
          substitute for professional legal advice.
        </p>
      </div>

      <div className="mt-9 space-y-8">
        {SECTIONS.map(({ id, title, body }) => (
          <section key={id} id={id} className="scroll-mt-24">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <div className="mt-2 text-sm leading-7 text-inkSoft">{body}</div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6 text-xs text-muted">
        <Link to="/privacy" className="btn-secondary btn-sm">
          Privacy information
        </Link>
        <Link to="/#faq" className="btn-ghost btn-sm">
          Read the FAQ
        </Link>
      </div>
    </div>
  );
}
