import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  LayoutTemplate,
  Monitor,
  Newspaper,
  PenLine,
  Rows3,
  Wand2,
} from 'lucide-react';
import HeroPortfolioPreview from '../components/marketing/HeroPortfolioPreview.jsx';
import TemplateThumb from '../components/templates/TemplateThumb.jsx';
import { TEMPLATES } from '../utils/templates.js';
import { useAuth } from '../context/AuthContext.jsx';

const HERO_POINTS = ['Six templates', 'Live editor preview', 'Public link you control'];

const STEPS = [
  {
    title: 'Choose a template',
    body: 'Six layouts built for different kinds of work. Preview each one with real rendered content before you commit.',
  },
  {
    title: 'Customize your details',
    body: 'Write your introduction, add projects, skills, education and experience. The editor previews every change.',
  },
  {
    title: 'Publish your portfolio',
    body: 'Publish to a public link such as /p/your-name and share it. Unpublish whenever you need to.',
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'Structured editing',
    body: 'Purpose-built sections for profile, projects, skills, education and experience. Drafts save as you type.',
  },
  {
    icon: Monitor,
    title: 'Responsive previews',
    body: 'Check the real template at desktop, tablet and mobile widths inside the editor before you publish.',
  },
  {
    icon: Rows3,
    title: 'Project management',
    body: 'Add, edit and reorder projects, each with optional live and source links, without touching the layout.',
  },
  {
    icon: Wand2,
    title: 'AI-assisted writing',
    body: 'Turn your notes into a summary or project description. The model works only from facts you supply, and you can edit or ignore the result.',
  },
  {
    icon: ClipboardCheck,
    title: 'Portfolio review',
    body: 'A documented 100-point rubric scores completeness, clarity, projects, links and readability, then lists what to fix first.',
  },
  {
    icon: Newspaper,
    title: 'Optional blog',
    body: 'Write Markdown posts, keep them as drafts and publish them to a blog page that matches your portfolio.',
  },
];

const AUDIENCES = [
  {
    title: 'Developer',
    body: 'Project rows, stack tags and repository links. The minimal developer layout keeps attention on what you built.',
  },
  {
    title: 'Student',
    body: 'Education, coursework and first projects presented clearly, for internships and campus placements.',
  },
  {
    title: 'Designer',
    body: 'An editorial layout with image-led project sections for visual and content work.',
  },
  {
    title: 'Freelancer',
    body: 'A short introduction, selected client work and an obvious way to start a conversation.',
  },
];

export default function Landing() {
  const location = useLocation();
  const { user } = useAuth();
  const startHref = user ? '/dashboard/create' : '/signup';

  useEffect(() => {
    const id = location.hash?.replace('#', '');
    const timer = setTimeout(() => {
      const element = id ? document.getElementById(id) : null;
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (!id) window.scrollTo({ top: 0 });
    }, 60);
    return () => clearTimeout(timer);
  }, [location.hash, location.pathname]);

  return (
    <div>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="border-b border-line">
        <div className="container-wide grid items-center gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-hover">Portfolio builder</p>
            <h1 className="mt-4 text-balance text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[42px] sm:leading-[1.08]">
              Your work deserves a better portfolio.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-muted">
              Build a professional portfolio from a template, edit every section in a live editor and publish it to a
              public link. No design tool required.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={startHref} className="btn-primary btn-lg">
                Get Started
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link to="/templates" className="btn-secondary btn-lg">
                Explore Templates
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
              {HERO_POINTS.map((point) => (
                <li key={point} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                  <Check size={13} className="shrink-0 text-accent" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* A real render of the Minimal Developer template, not a mockup. */}
          <div className="w-full max-w-[560px] justify-self-start lg:justify-self-end">
            <HeroPortfolioPreview />
            <p className="mt-3 text-[12px] text-faint">Sample content shown in the Minimal Developer template.</p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- How it works */}
      <section id="how-it-works" className="border-b border-line bg-surface">
        <div className="container-wide py-16">
          <div className="max-w-2xl">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">How it works</h2>
            <p className="mt-3 text-[14px] leading-6 text-muted">
              Three steps, and you can stop at any point — drafts stay saved to your account.
            </p>
          </div>

          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="bg-surface p-6">
                <span className="text-[12px] font-semibold tabular-nums text-accent-hover">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-[15px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------------- Features */}
      <section id="features" className="border-b border-line">
        <div className="container-wide py-16">
          <div className="max-w-2xl">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">Built for the whole job</h2>
            <p className="mt-3 text-[14px] leading-6 text-muted">
              Writing, layout decisions, review and publishing. PortiAI keeps each part straightforward.
            </p>
          </div>

          <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon size={18} className="text-accent" aria-hidden="true" />
                <h3 className="mt-3 text-[14px] font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Templates */}
      <section id="templates" className="border-b border-line bg-surface">
        <div className="container-wide py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">Six templates</h2>
              <p className="mt-3 text-[14px] leading-6 text-muted">
                Each is a complete layout with its own typography and section treatment. Switch at any time without
                losing your text.
              </p>
            </div>
            <Link to="/templates" className="btn-secondary btn-sm w-fit">
              Open the gallery
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
              <article key={template.id} className="overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-lineStrong">
                <div className="border-b border-line bg-canvasAlt">
                  <TemplateThumb template={template} designHeight={620} />
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[14px] font-semibold text-ink">{template.name}</h3>
                    <span className="text-[10.5px] uppercase tracking-[0.08em] text-faint">
                      {template.tone === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{template.tagline}</p>
                  <Link to="/templates" className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent-hover hover:underline hover:underline-offset-4">
                    Preview template
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Portfolio types */}
      <section className="border-b border-line">
        <div className="container-wide py-16">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">Made for your work</h2>
              <p className="mt-3 text-[14px] leading-6 text-muted">
                The same content model, presented four different ways. Pick the layout that matches how you want to be
                read.
              </p>
            </div>

            <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {AUDIENCES.map((item) => (
                <div key={item.title} className="border-t border-line pt-4">
                  <dt className="text-[13.5px] font-semibold text-ink">{item.title}</dt>
                  <dd className="mt-1.5 text-[13px] leading-6 text-muted">{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Final CTA */}
      <section>
        <div className="container-wide py-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-line bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Ready to show your work?</h2>
              <p className="mt-2 max-w-lg text-[14px] leading-6 text-muted">
                Create an account, pick a template and publish a portfolio you can share today.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
                {['Six templates', 'Preview at three screen sizes', 'Private until you publish'].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check size={12} className="shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link to={startHref} className="btn-primary shrink-0">
              <PenLine size={15} aria-hidden="true" />
              Create Your Portfolio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
