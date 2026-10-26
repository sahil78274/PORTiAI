import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, FileText, LayoutTemplate, Monitor, Newspaper, Sparkles, Wand2 } from 'lucide-react';
import HeroPortrait from '../components/marketing/HeroPortrait.jsx';
import TemplateThumb from '../components/templates/TemplateThumb.jsx';
import { TEMPLATES } from '../utils/templates.js';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = [
  {
    title: 'Choose a template',
    body: 'Six layouts built for different kinds of work — engineering, design, study, freelance and leadership. Every one can be previewed with real rendered content before you commit.',
  },
  {
    title: 'Add your details',
    body: 'Write your introduction, list projects, skills, education and experience. The editor shows the portfolio as you type, at desktop, tablet and mobile widths.',
  },
  {
    title: 'Publish your portfolio',
    body: 'Press publish to get a public link such as /p/your-name. Copy it into an application, a CV or a message. Unpublish whenever you need to.',
  },
];

const AUDIENCES = [
  {
    title: 'Developer portfolios',
    body: 'Project rows, stack tags and repository links. The minimal developer layout keeps attention on what you built.',
    link: '/templates',
    linkLabel: 'See the developer template',
  },
  {
    title: 'Student portfolios',
    body: 'Education, coursework and first projects presented clearly, for internships and campus placements.',
    link: '/templates',
    linkLabel: 'See the student template',
  },
  {
    title: 'Designer portfolios',
    body: 'An editorial layout with image-led project sections for visual and content work.',
    link: '/templates',
    linkLabel: 'See the designer template',
  },
  {
    title: 'Freelancer portfolios',
    body: 'A short introduction, selected client work and an obvious way to start a conversation.',
    link: '/templates',
    linkLabel: 'See the freelancer template',
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'Portfolio editing',
    body: 'Structured sections for profile, projects, skills, education, experience and achievements. Autosave keeps your draft current.',
  },
  {
    icon: Monitor,
    title: 'Responsive previews',
    body: 'Check every template at desktop, tablet and mobile widths inside the editor before you publish.',
  },
  {
    icon: LayoutTemplate,
    title: 'Project management',
    body: 'Add, edit and reorder projects, with optional live and source links for each one.',
  },
  {
    icon: Wand2,
    title: 'AI-assisted writing',
    body: 'Ask for help turning your notes into a summary or a project description, then edit the result. Nothing is invented beyond the facts you give.',
  },
  {
    icon: Sparkles,
    title: 'Portfolio review',
    body: 'Run a documented 100-point review of your own portfolio: completeness, clarity, projects, links and readability.',
  },
  {
    icon: Newspaper,
    title: 'Optional blog',
    body: 'Write Markdown posts and publish them alongside your portfolio at its own page.',
  },
];

export default function Landing() {
  const location = useLocation();
  const { user } = useAuth();
  const startHref = user ? '/dashboard/create' : '/register';

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
        <div className="container-wide grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(300px,38%)] lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted">Portfolio builder for professionals</p>
            <h1 className="mt-4 text-balance text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[44px]">
              Your work deserves a better portfolio.
            </h1>
            <p className="mt-4 max-w-lg text-[16px] leading-7 text-muted">
              Create a professional portfolio that showcases your skills, projects and experience. Start with a template,
              customize your details and publish when you’re ready.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Link to={startHref} className="btn-primary">
                Create Your Portfolio
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link to="/templates" className="btn-secondary">
                Explore Templates
              </Link>
            </div>

            <p className="mt-5 max-w-md text-[13px] leading-6 text-muted">
              Every template is editable, no design skills needed. Publish to a public link in a minute, and change it whenever
              your work changes.
            </p>

            <ul className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted">
              {['Six templates', 'Desktop, tablet and mobile previews', 'Private until you publish'].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check size={12} className="shrink-0 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[360px] lg:mx-0 lg:max-w-none">
            <HeroPortrait />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- How it works */}
      <section id="how-it-works" className="border-b border-line bg-white">
        <div className="container-wide py-14 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">How it works</h2>
            <p className="mt-2 text-[15px] leading-7 text-muted">
              Three steps, no design tool required. You can stop at any point — drafts stay saved to your account.
            </p>
          </div>

          <ol className="mt-8 grid gap-x-10 gap-y-8 border-t border-line pt-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-lineStrong text-[11px] font-semibold text-muted">
                    {index + 1}
                  </span>
                  <h3 className="text-[15px] font-semibold">{step.title}</h3>
                </div>
                <p className="mt-2 text-[14px] leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------ Made for your work */}
      <section className="border-b border-line">
        <div className="container-wide py-14 lg:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">Made for your work</h2>
              <p className="mt-2 text-[15px] leading-7 text-muted">
                The same content model, presented four different ways. Pick the layout that matches how you want to be read.
              </p>
            </div>
            <Link to="/templates" className="btn-secondary btn-sm w-fit">
              View all templates
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-x-8 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((item) => (
              <div key={item.title} className="border-l border-line pl-4">
                <h3 className="text-[15px] font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{item.body}</p>
                <Link to={item.link} className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-hover">
                  {item.linkLabel}
                  <ArrowRight size={11} aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Templates */}
      <section id="templates" className="border-b border-line bg-white">
        <div className="container-wide py-14 lg:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">Explore templates</h2>
              <p className="mt-2 text-[15px] leading-7 text-muted">
                Rendered with sample content, exactly as they will look when published. You can switch template at any time
                without losing your text.
              </p>
            </div>
            <Link to="/templates" className="btn-secondary btn-sm w-fit">
              Open the template gallery
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
              <article key={template.id} className="overflow-hidden rounded-lg border border-line bg-white">
                <div className="border-b border-line">
                  <TemplateThumb template={template} designHeight={600} />
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[14px] font-semibold">{template.name}</h3>
                    <span className="text-[11px] text-faint">{template.tone === 'dark' ? 'Dark' : 'Light'}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-muted">{template.tagline}</p>
                  <Link
                    to="/templates"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-hover"
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

      {/* ------------------------------------------------------------- Features */}
      <section id="features" className="border-b border-line">
        <div className="container-wide py-14 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">Useful features</h2>
            <p className="mt-2 text-[15px] leading-7 text-muted">
              The parts that usually stall a portfolio: writing, layout decisions and publishing. PortiAI keeps each one
              straightforward.
            </p>
          </div>

          <div className="mt-8 grid gap-x-10 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-accent">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Final CTA */}
      <section className="bg-white">
        <div className="container-wide flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center lg:py-16">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">Ready to show your work?</h2>
            <p className="mt-2 max-w-lg text-[15px] leading-7 text-muted">
              Create an account, pick a template and publish a portfolio you can share today.
            </p>
          </div>
          <Link to={startHref} className="btn-primary shrink-0">
            Create Your Portfolio
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
