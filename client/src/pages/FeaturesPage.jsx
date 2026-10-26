import { Link } from 'react-router-dom';
import { ArrowRight, Check, Gauge, Globe2, LayoutTemplate, Newspaper, Palette, ShieldCheck, Smartphone, Sparkles, Wand2 } from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, title: 'Conversational AI builder', body: 'A guided chat collects your real experience — name, role, summary, skills, projects, experience, education, links and blog choice — then drafts editable portfolio content.', points: ['Uses only your facts', 'Editable output', 'No keys in the browser'] },
  { icon: Palette, title: 'Design that adapts to you', body: 'Nine templates, accent colours, three font stacks and two spacing densities. Every change renders instantly in a live preview.', points: ['9 templates', 'Live theme controls', 'Section ordering'] },
  { icon: Gauge, title: 'Portfolio analyser', body: 'A deterministic 100-point rubric plus optional AI observations. Scan your own portfolio, another live URL or an uploaded HTML file.', points: ['Severity-grouped issues', 'Actionable fixes', 'Honest limitations'] },
  { icon: Smartphone, title: 'Responsive previews', body: 'Check desktop, tablet and mobile layouts from inside the editor before publishing.', points: ['3 breakpoints', 'Mobile-first templates', 'Accessible focus states'] },
  { icon: Globe2, title: 'Real publishing', body: 'Publish to a stable public URL rendered from saved data — no static export step, no separate host to configure.', points: ['Copy & share link', 'Unpublish anytime', 'SEO metadata'] },
  { icon: Newspaper, title: 'Blog studio', body: 'Write posts in Markdown with AI writing help, keep drafts private and publish a matching blog page inside your portfolio.', points: ['Markdown editor', 'Draft / publish', 'AI assistance'] },
];

export default function FeaturesPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(ellipse 700px 380px at 50% -20%, rgba(168,85,247,0.25), transparent 70%)' }} aria-hidden="true" />
        <div className="container-wide relative py-16 sm:py-20">
          <p className="eyebrow">Features</p>
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            A complete portfolio studio, not a form that spits out a page.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            PortiAI covers the full path: writing, design, quality checks, publishing and a blog. Below is exactly what
            each part does — and what it deliberately does not.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">
              Get started free
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to="/templates" className="btn-secondary">
              <LayoutTemplate size={15} aria-hidden="true" />
              Explore templates
            </Link>
          </div>
        </div>
      </section>

      <section className="container-wide py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, points }) => (
            <article key={title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-accent-hover">
                <Icon size={19} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                {points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-xs text-inkSoft">
                    <Check size={12} className="text-success" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.07] bg-[#060a16] py-16">
        <div className="container-wide grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Engineering notes</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Built to be trustworthy</h2>
            <ul className="mt-5 space-y-4">
              {[
                { icon: ShieldCheck, title: 'Security by default', body: 'Bcrypt password hashing, HTTP-only session cookies with token-version revocation, strict ownership checks on every private route, SSRF-protected scans.' },
                { icon: Wand2, title: 'No fabricated AI output', body: 'The AI is constrained to supplied facts, and failures downgrade honestly with a visible message instead of inventing content.' },
                { icon: Gauge, title: 'Reproducible scoring', body: 'The analyser rubric is documented and deterministic. AI observations never change the numeric score.' },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-accent-hover">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-surface/60 p-6">
            <p className="text-sm font-semibold text-white">Currently not implemented</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Being explicit is part of the product. These are deliberately absent rather than mocked up:
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted">
              {[
                'Social / OAuth sign-in (email and password only)',
                'Automated password reset emails',
                'Paid billing and custom domains',
                'Turnkey PDF export',
                'PDF or screenshot portfolio analysis',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/#faq" className="btn-secondary btn-sm mt-5">
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
