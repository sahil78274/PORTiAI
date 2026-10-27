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
      <section className="hero-glow relative overflow-hidden">
        <div className="container-wide grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:pb-20 lg:pt-14">
          {/* Copy */}
          <div className="max-w-[540px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-[11.5px] font-semibold text-accent-hover shadow-neu-sm">
              <Sparkles size={13} aria-hidden="true" />
              AI-powered portfolio builder
            </span>
            <h1 className="mt-5 text-balance text-[36px] font-bold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[48px]">
              Build a portfolio that does your work justice — with AI.
            </h1>
            <p className="mt-5 max-w-[480px] text-[15px] leading-7 text-muted sm:text-[16px]">
              Answer a few questions and PortiAI drafts your portfolio from the facts you give it. Pick a template,
              refine every detail in a live editor and publish when you&apos;re ready.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to={startHref} className="btn-primary btn-lg">
                Get Started
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/templates" className="btn-secondary btn-lg">
                <LayoutTemplate size={16} aria-hidden="true" />
                Explore Templates
              </Link>
            </div>

            <ul className="mt-9 grid max-w-[460px] grid-cols-2 gap-3">
              {HERO_BENEFITS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-[12.5px] font-medium text-inkSoft">
                  <span className="icon-tile-sm">
                    <Icon size={13} aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Builder preview: the real Minimal Developer template inside a soft UI workspace */}
          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="rounded-[28px] bg-surface p-4 shadow-neu-lg sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5">
                  <span className="icon-tile-accent h-8 w-8 rounded-[10px]">
                    <Wand2 size={14} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink">Portfolio builder</p>
                    <p className="text-[10.5px] text-muted">Live preview · autosaved</p>
                  </div>
                </div>
                <div className="segmented hidden sm:inline-flex" aria-hidden="true">
                  <span className="segmented-item segmented-item-active px-2.5 py-1 text-[10.5px]">Desktop</span>
                  <span className="segmented-item px-2.5 py-1 text-[10.5px]">Tablet</span>
                  <span className="segmented-item px-2.5 py-1 text-[10.5px]">Mobile</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
                {/* Editor sidebar sketch */}
                <div className="hidden space-y-2.5 rounded-[18px] bg-canvas p-3 shadow-neu-inset-sm sm:block" aria-hidden="true">
                  {['Profile', 'Projects', 'Skills', 'Experience'].map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-[10px] px-2.5 py-2 text-[10.5px] font-medium ${
                        index === 0 ? 'bg-surface text-accent-hover shadow-neu-xs' : 'text-muted'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                  <div className="!mt-4 rounded-[12px] bg-surface p-2.5 shadow-neu-xs">
                    <p className="flex items-center gap-1 text-[9.5px] font-semibold text-accent-hover">
                      <Sparkles size={10} aria-hidden="true" />
                      AI suggestion
                    </p>
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1 w-full rounded-full bg-lineStrong" />
                      <div className="h-1 w-4/5 rounded-full bg-lineStrong" />
                    </div>
                  </div>
                </div>

                <HeroPortfolioPreview />
              </div>
            </div>

            {/* Floating portrait card */}
            <div className="relative mt-5 w-fit rounded-[20px] bg-surface py-3 pl-3 pr-5 shadow-neu sm:absolute sm:-bottom-10 sm:-left-8 sm:mt-0">
              <HeroPortrait compact />
            </div>

            {/* Floating published pill */}
            <div className="absolute -right-3 -top-4 hidden items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-[11.5px] font-semibold text-ink shadow-neu sm:flex" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-success" />
              Published · /p/farheen
            </div>
            <p className="mt-3 text-center text-[11px] text-faint sm:mt-14 sm:pl-48 sm:text-right">
              Sample content in the Minimal Developer template
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- How it works */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="container-wide py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-[28px] font-bold tracking-[-0.025em] text-ink sm:text-[32px]">Three steps to a published portfolio</h2>
            <p className="mt-3 text-[14.5px] leading-7 text-muted">
              No design tool required. You can stop at any point — drafts stay saved to your account.
            </p>
          </div>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-canvas text-[15px] font-bold text-accent-hover shadow-neu-inset-sm">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-[16px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------------- Features */}
      <section id="features" className="scroll-mt-20">
        <div className="container-wide py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Features</p>
            <h2 className="mt-2 text-[28px] font-bold tracking-[-0.025em] text-ink sm:text-[32px]">Built for the whole job</h2>
            <p className="mt-3 text-[14.5px] leading-7 text-muted">
              Writing, layout decisions, review and publishing. PortiAI keeps each part straightforward.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card-hover p-6">
                <span className="icon-tile h-12 w-12 rounded-[14px]">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-[15px] font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Templates */}
      <section id="templates" className="scroll-mt-20">
        <div className="container-wide py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Templates</p>
              <h2 className="mt-2 text-[28px] font-bold tracking-[-0.025em] text-ink sm:text-[32px]">Six templates</h2>
              <p className="mt-3 text-[14.5px] leading-7 text-muted">
                Each is a complete layout with its own typography and section treatment. Switch at any time without
                losing your text.
              </p>
            </div>
            <Link to="/templates" className="btn-secondary w-fit">
              Open the gallery
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
              <article key={template.id} className="card-hover flex flex-col p-3">
                <div className="overflow-hidden rounded-[14px] bg-canvas p-1.5 shadow-neu-inset-sm">
                  <div className="overflow-hidden rounded-[10px]">
                    <TemplateThumb template={template} designHeight={600} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-2 pb-2 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold text-ink">{template.name}</h3>
                    <span className={template.tone === 'dark' ? 'badge bg-ink text-white' : 'badge-draft'}>
                      {template.tone === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </div>
                  <p className="mt-1 flex-1 text-[12.5px] leading-5 text-muted">{template.tagline}</p>
                  <Link to="/templates" className="btn-link mt-3 text-[12.5px]">
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
      <section>
        <div className="container-wide py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Who it&apos;s for</p>
            <h2 className="mt-2 text-[28px] font-bold tracking-[-0.025em] text-ink sm:text-[32px]">Made for your work</h2>
            <p className="mt-3 text-[14.5px] leading-7 text-muted">
              The same content model, presented four different ways. Pick the layout that matches how you want to be
              read.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((item) => (
              <div key={item.title} className="panel p-6">
                <h3 className="text-[15px] font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Final CTA */}
      <section>
        <div className="container-wide pb-20 pt-6">
          <div className="card relative flex flex-col items-start justify-between gap-8 overflow-hidden p-8 sm:p-10 md:flex-row md:items-center">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-canvas shadow-neu-inset" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-[26px] font-bold tracking-[-0.025em] text-ink sm:text-[30px]">Ready to show your work?</h2>
              <p className="mt-2 max-w-lg text-[14.5px] leading-7 text-muted">
                Create an account, pick a template and publish a portfolio you can share today.
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium text-inkSoft">
                {['Six templates', 'Preview at three screen sizes', 'Private until you publish'].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check size={13} className="shrink-0 text-accent-hover" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link to={startHref} className="btn-primary btn-lg relative shrink-0">
              <PenLine size={16} aria-hidden="true" />
              Create Your Portfolio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
