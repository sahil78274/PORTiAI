import { Link } from 'react-router-dom';
import { TEMPLATE_COUNT, PREMIUM_TEMPLATE_COUNT } from '../data/templateCatalogue.js';
import { ArrowRight, Check, FileText, Gauge, LayoutTemplate, Monitor, Newspaper, Wand2 } from 'lucide-react';

const FEATURES = [
  {
    icon: FileText,
    title: 'Structured editing',
    body: 'Separate sections for your profile, projects, skills, education, experience and achievements — the same content model across every template.',
    points: ['Autosaved drafts', 'Section visibility and order', 'Accent, font and spacing controls'],
  },
  {
    icon: Monitor,
    title: 'Live previews at three widths',
    body: 'The editor shows the real template, not a mockup, and can be switched between desktop, tablet and mobile.',
    points: ['Desktop, tablet, mobile', 'Full-screen preview', 'Same components used publicly'],
  },
  {
    icon: Wand2,
    title: 'AI writing help',
    body: 'Ask for a summary or a project description based on notes you provide. The model is instructed not to add facts, and you can edit or ignore the result.',
    points: ['Only your facts', 'Editable output', 'Degrades honestly when unavailable'],
  },
  {
    icon: Gauge,
    title: 'Portfolio review',
    body: 'A documented 100-point rubric scores completeness, summary clarity, project detail, skills, experience, links and readability.',
    points: ['Per-category scores', 'Severity-ranked issues', 'One-click rewrite suggestions'],
  },
  {
    icon: Newspaper,
    title: 'Optional blog',
    body: 'Write posts in Markdown, keep them as drafts, and publish them to a blog page that shares your portfolio’s design and URL.',
    points: ['Markdown editor', 'Draft and publish states', 'Attached to one portfolio'],
  },
  {
    icon: LayoutTemplate,
    title: 'A real template catalogue',
    body: `${TEMPLATE_COUNT} templates: ten layouts across ten visual styles, plus the six original designs. Six colour themes for the app itself. Switch design without retyping anything.`,
    points: [`${PREMIUM_TEMPLATE_COUNT} premium designs`, 'Preview before choosing', 'Free and premium tiers'],
  },
];

const LIMITS = [
  'Password reset by email — needs a transactional email provider. The forgot-password page explains the situation.',
  'Sign in with Google or GitHub — accounts are email and password only.',
  'Custom domains and PDF export.',
  'Screenshot or PDF portfolio analysis — the website scanner reads HTML only.',
];

export default function FeaturesPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="container-wide py-14">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">Features</p>
          <h1 className="mt-3 max-w-2xl text-balance text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[40px]">
            A portfolio builder, not a form that generates a page.
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">
            PortiAI covers writing, layout, review and publishing. Here is what each part does, and what it deliberately
            does not do.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/signup" className="btn-primary">
              Create an account
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to="/templates" className="btn-secondary">
              Browse templates
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="container-wide py-14">
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, points }) => (
              <div key={title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-canvas text-accent-hover">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <h2 className="mt-3 text-[15px] font-semibold">{title}</h2>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{body}</p>
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-[12px] text-inkSoft">
                      <Check size={12} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container-wide grid gap-10 py-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em]">How the data is handled</h2>
            <ul className="mt-4 space-y-3 text-[14px] leading-7 text-muted">
              <li className="flex gap-2.5">
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-lineStrong" aria-hidden="true" />
                Passwords are hashed with bcrypt and sessions use an HTTP-only cookie. Signing out invalidates the session on
                the server, not only in the browser.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-lineStrong" aria-hidden="true" />
                Only published portfolios are readable publicly, and the public payload excludes account data and your
                analysis results.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-lineStrong" aria-hidden="true" />
                AI requests are made from the server. No API key is present in the browser bundle, and each account has a
                daily request ceiling.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <h2 className="text-[15px] font-semibold">Not implemented</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-muted">
              These are absent rather than mocked. The interface says so where relevant.
            </p>
            <ul className="mt-3 space-y-2 text-[13px] leading-6 text-muted">
              {LIMITS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
