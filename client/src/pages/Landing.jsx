import FarheenPhoto from "../components/FarheenPhoto";
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  Check,
  FileText,
  LayoutTemplate,
  Monitor,
  Newspaper,
  PanelsTopLeft,
  PenLine,
  Rocket,
  Sparkles,
  Wand2,
} from 'lucide-react';
import HeroPortrait from '../components/marketing/HeroPortrait.jsx';
import HeroPortfolioPreview from '../components/marketing/HeroPortfolioPreview.jsx';
import TemplateThumb from '../components/templates/TemplateThumb.jsx';
import { TEMPLATES } from '../utils/templates.js';
import { useAuth } from '../context/AuthContext.jsx';

const HERO_BENEFITS = [
  { icon: LayoutTemplate, label: 'Modern templates' },
  { icon: PanelsTopLeft, label: 'Easy customization' },
  { icon: Monitor, label: 'Responsive design' },
  { icon: Rocket, label: 'Publish in minutes' },
];

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
    title: 'Structured portfolio editing',
    body: 'Separate sections for profile, projects, skills, education, experience and achievements, with drafts saved as you type.',
  },
  {
    icon: Monitor,
    title: 'Responsive previews',
    body: 'Check the real template at desktop, tablet and mobile widths inside the editor before you publish.',
  },
  {
    icon: Blocks,
    title: 'Project management',
    body: 'Add, edit and reorder projects, each with optional live and source links, without touching the layout.',
  },
  {
    icon: Wand2,
    title: 'AI-assisted writing',
    body: 'Turn your notes into a summary or project description. The model works only from facts you supply, and you can edit or ignore the result.',
  },
  {
    icon: Sparkles,
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
      <section className="hero-glow relative border-b border-line">
        <div className="container-wide grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(220px,0.62fr)_minmax(280px,0.95fr)] lg:gap-8 lg:py-12 xl:gap-10">
          {/* Copy */}
          <div className="max-w-[520px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-hover">Portfolio builder</p>
            <h1 className="mt-3 text-balance text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-ink sm:text-[40px]">
              Your work deserves a better portfolio.
            </h1>
            <p className="mt-3.5 max-w-[470px] text-[14px] leading-6 text-muted sm:text-[15px] sm:leading-7">
              Create a professional portfolio that showcases your skills, projects and experience. Start with a
              template, customize your details and publish when you&apos;re ready.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link to={startHref} className="btn-primary">
                Create Your Portfolio
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link to="/templates" className="btn-secondary">
                Explore Templates
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/70 pt-4 text-[11.5px] text-muted">
              {HERO_BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5">
                  <Icon size={13} className="shrink-0 text-accent-hover" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Circular portrait */}
          <div className="mx-auto">
            <HeroPortrait />
          </div>

          {/* Live portfolio preview */}
          <div className="w-full max-w-[420px] justify-self-center lg:justify-self-end">
            <HeroPortfolioPreview />
            <p className="mt-2.5 text-center text-[11px] text-faint lg:text-right">
              Sample content in the Minimal Developer template
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- How it works */}
      <section id="how-it-works" className="border-b border-line">
        <div className="container-wide py-14">
          <div className="max-w-2xl">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">How it works</h2>
            <p className="mt-2 text-[14px] leading-6 text-muted">
              Three steps, no design tool required. You can stop at any point — drafts stay saved to your account.
            </p>
          </div>

          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-lg border border-line bg-surface p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-[12px] font-semibold text-accent-hover">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------------- Features */}
      <section id="features" className="border-b border-line bg-canvasAlt/60">
        <div className="container-wide py-14">
          <div className="max-w-2xl">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">Built for the whole job</h2>
            <p className="mt-2 text-[14px] leading-6 text-muted">
              Writing, layout decisions, review and publishing. PortiAI keeps each part straightforward.
            </p>
          </div>

          <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-accent-hover">
                  <Icon size={15} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-semibold text-ink">{title}</h3>
                  <p className="mt-1 text-[12.5px] leading-6 text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Templates */}
      <section id="templates" className="border-b border-line">
        <div className="container-wide py-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">Six templates</h2>
              <p className="mt-2 text-[14px] leading-6 text-muted">
                Each is a complete layout with its own typography and section treatment. Switch at any time without
                losing your text.
              </p>
            </div>
            <Link to="/templates" className="btn-secondary btn-sm w-fit">
              Open the gallery
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
              <article
                key={template.id}
                className="overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-accent-line"
              >
                <div className="border-b border-line">
                  <TemplateThumb template={template} designHeight={600} />
                </div>
                <div className="p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[13.5px] font-semibold text-ink">{template.name}</h3>
                    <span className="text-[10.5px] uppercase tracking-[0.08em] text-faint">
                      {template.tone === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-muted">{template.tagline}</p>
                  <Link
                    to="/templates"
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent-hover hover:text-accent-hover"
                  >
                    Preview template
                    <ArrowRight size={11} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Portfolio types */}
      <section className="border-b border-line bg-canvasAlt/60">
        <div className="container-wide py-14">
          <div className="max-w-2xl">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">Made for your work</h2>
            <p className="mt-2 text-[14px] leading-6 text-muted">
              The same content model, presented four different ways. Pick the layout that matches how you want to be
              read.
            </p>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((item) => (
              <div key={item.title} className="rounded-lg border border-line bg-surface p-4">
                <h3 className="text-[13.5px] font-semibold text-ink">{item.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Final CTA */}
      <section>
        <div className="container-wide flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">Ready to show your work?</h2>
            <p className="mt-2 max-w-lg text-[14px] leading-6 text-muted">
              Create an account, pick a template and publish a portfolio you can share today.
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-muted">
              {['Six templates', 'Preview at three screen sizes', 'Private until you publish'].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check size={12} className="shrink-0 text-accent-hover" aria-hidden="true" />
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
      </section>
    </div>
  );
}
