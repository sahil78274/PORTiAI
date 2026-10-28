import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  LayoutTemplate,
  Lock,
  Monitor,
  Newspaper,
  Palette,
  PenLine,
  Rows3,
  Sparkles,
  Wand2,
} from 'lucide-react';
import HeroPortfolioPreview from '../components/marketing/HeroPortfolioPreview.jsx';
import TemplateThumb from '../components/templates/TemplateThumb.jsx';
import { TEMPLATE_CATALOGUE, TEMPLATE_COUNT, PREMIUM_TEMPLATE_COUNT, FREE_TEMPLATE_COUNT } from '../data/templateCatalogue.js';
import { TEMPLATE_STYLES } from '../data/templateStyles.js';
import { filterTemplates } from '../utils/templateQuery.js';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = [
  {
    title: 'Pick a template',
    body: `Browse ${TEMPLATE_COUNT} designs, preview each at desktop, tablet and mobile width, then start from the one that fits.`,
  },
  {
    title: 'Make it yours',
    body: 'Write your introduction, add projects, skills, education and experience. Every change appears in the live preview.',
  },
  {
    title: 'Publish a public link',
    body: 'Publish to /p/your-name and share it. Edit and unpublish whenever you like — the link is yours.',
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

export default function Landing() {
  const location = useLocation();
  const { user } = useAuth();
  const startHref = user ? '/dashboard/create' : '/signup';

  const featured = useMemo(() => filterTemplates(TEMPLATE_CATALOGUE, { sort: 'featured' }).slice(0, 6), []);

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
      {/* ------------------------------------------------------------- Hero */}
      <section className="hero-glow relative overflow-hidden border-b border-line">
        <div className="container-wide grid items-center gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className="eyebrow-accent">
              <Sparkles size={11} aria-hidden="true" />
              {PREMIUM_TEMPLATE_COUNT} premium portfolio templates
            </p>
            <h1 className="mt-5 text-balance text-[36px] font-semibold leading-[1.03] tracking-[-0.045em] text-ink sm:text-[54px]">
              A portfolio that looks like the work you do.
            </h1>
            <p className="mt-5 max-w-lg text-[15.5px] leading-7 text-muted">
              Start from {TEMPLATE_COUNT} genuinely different portfolio designs — ten layouts, ten visual styles and six
              colour themes. Edit everything in a live editor and publish a link you control.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={startHref} className="btn-primary btn-lg rounded-full">
                Start free
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link to="/templates" className="btn-secondary btn-lg rounded-full">
                <LayoutTemplate size={15} aria-hidden="true" />
                Browse templates
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
              {[`${FREE_TEMPLATE_COUNT} free templates`, 'Live previews', 'Public link you control'].map((point) => (
                <li key={point} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                  <Check size={13} className="shrink-0 text-accent" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative w-full max-w-[600px] justify-self-start lg:justify-self-end">
            <HeroPortfolioPreview />
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[
                { id: 'bento-bubble-blocks', name: 'Bento' },
                { id: 'gallery-frame-wall', name: 'Gallery' },
                { id: 'terminal-night-shell', name: 'Terminal' },
              ].map((item) => {
                const template = TEMPLATE_CATALOGUE.find((entry) => entry.id === item.id);
                return (
                  <Link
                    key={item.id}
                    to={`/templates/${item.id}`}
                    className="group overflow-hidden rounded-lg border border-line bg-surface transition hover:border-lineStrong"
                  >
                    <TemplateThumb template={template} designWidth={900} designHeight={640} />
                    <span className="block border-t border-line px-2 py-1.5 text-[11px] font-medium text-muted transition-colors group-hover:text-ink">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px] text-faint">Sample content shown in real catalogue templates.</p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Stats band */}
      <section className="border-b border-line bg-surface">
        <div className="container-wide grid grid-cols-2 gap-px overflow-hidden py-6 sm:grid-cols-4">
          {[
            { value: TEMPLATE_COUNT, label: 'templates' },
            { value: PREMIUM_TEMPLATE_COUNT, label: 'premium designs' },
            { value: TEMPLATE_STYLES.length, label: 'visual styles' },
            { value: 6, label: 'colour themes' },
          ].map((stat) => (
            <div key={stat.label} className="px-2 py-2 text-center">
              <p className="text-[26px] font-semibold tracking-[-0.03em] text-ink tabular-nums">{stat.value}</p>
              <p className="text-[11.5px] uppercase tracking-[0.12em] text-faint">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- How it works */}
      <section id="how-it-works" className="border-b border-line">
        <div className="container-wide py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-ink">Three steps, no design tools.</h2>
            <p className="mt-3 text-[14px] leading-7 text-muted">
              Drafts stay saved to your account, so you can stop after any step and come back later.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="surface-card p-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-hover">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------- Featured designs */}
      <section id="templates" className="border-b border-line bg-surface">
        <div className="container-wide py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Featured designs</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-ink">A layout for every kind of work.</h2>
              <p className="mt-3 text-[14px] leading-7 text-muted">
                Developer, designer, student, freelancer, photographer, agency — each template is a complete design,
                not a recolour of the last one.
              </p>
            </div>
            <Link to="/templates" className="btn-secondary rounded-full">
              Open the gallery
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((template) => (
              <Link
                key={template.id}
                to={`/templates/${template.id}`}
                className="group overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 hover:-translate-y-1 hover:border-lineStrong hover:shadow-float"
              >
                <div className="border-b border-line bg-canvasAlt">
                  <TemplateThumb template={template} designHeight={620} />
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                      {template.name}
                      {template.tier === 'premium' ? <Lock size={11} className="text-accent-hover" aria-label="Premium template" /> : null}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted">
                      {template.category} · {template.layoutLabel} layout
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="mt-1 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Styles */}
      <section className="border-b border-line">
        <div className="container-wide py-16">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="eyebrow">Visual styles</p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-ink">Pick the register, not just the layout.</h2>
              <p className="mt-3 text-[14px] leading-7 text-muted">
                Every catalogue template pairs a structure with a style — from quiet minimalism to neo-brutalism, glass,
                cinematic dark and editorial print. Change your mind later without rewriting a word.
              </p>
              <Link to="/templates" className="btn-secondary mt-5 rounded-full">
                <Palette size={14} aria-hidden="true" />
                Filter by style
              </Link>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {TEMPLATE_STYLES.map((style) => (
                <Link
                  key={style.id}
                  to={`/templates?style=${style.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-3 transition hover:border-lineStrong"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-black/10"
                    style={{
                      background: style.preview[0].startsWith('#') ? style.preview[0] : undefined,
                      backgroundImage: style.tokens.bg.startsWith('linear') || style.tokens.bg.startsWith('radial') ? style.tokens.bg : undefined,
                    }}
                    aria-hidden="true"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: style.preview[0].startsWith('#') ? style.tokens.surfaceAccent : '#ffffff' }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-medium text-ink">{style.label}</span>
                    <span className="block truncate text-[11px] text-muted">{style.blurb}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Features */}
      <section id="features" className="border-b border-line bg-surface">
        <div className="container-wide py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">The product</p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-ink">More than a pretty template.</h2>
            <p className="mt-3 text-[14px] leading-7 text-muted">
              Writing, layout, review and publishing. PortiAI keeps each part straightforward.
            </p>
          </div>

          <div className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-canvas text-accent">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-[14px] font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Pricing */}
      <section className="border-b border-line">
        <div className="container-wide py-16">
          <div className="max-w-2xl">
            <p className="eyebrow">Plans</p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-ink">Free to start. Premium for the full catalogue.</h2>
            <p className="mt-3 text-[14px] leading-7 text-muted">
              Premium unlocks the {PREMIUM_TEMPLATE_COUNT} premium designs. Everything you already get on Free stays
              exactly as it is.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            <div className="surface-card p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[16px] font-semibold text-ink">Free</h3>
                <p className="text-[13px] text-muted">₹0 forever</p>
              </div>
              <ul className="mt-4 space-y-2">
                {[`${FREE_TEMPLATE_COUNT} original templates`, 'Full editor and live previews', 'Portfolio review and AI writing', 'One public portfolio link'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                    <Check size={14} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to={startHref} className="btn-secondary mt-5 w-full justify-center">
                Start free
              </Link>
            </div>

            <div className="surface-card relative overflow-hidden border-accent-line p-6">
              <span className="absolute right-4 top-4 badge-premium">Most complete</span>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[16px] font-semibold text-ink">Premium</h3>
                <p className="text-[13px] text-muted">Unlocks every design</p>
              </div>
              <ul className="mt-4 space-y-2">
                {[`All ${TEMPLATE_COUNT} templates`, 'Ten layouts × ten styles', 'New templates as they ship', 'Everything in Free'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/premium" className="btn-primary mt-5 w-full justify-center">
                See Premium
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Final CTA */}
      <section>
        <div className="container-wide py-16">
          <div className="hero-glow flex flex-col items-start justify-between gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-ink">Ready to show your work?</h2>
              <p className="mt-2 max-w-lg text-[14px] leading-6 text-muted">
                Create an account, pick a design and publish a portfolio you can share today.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
                {[`${TEMPLATE_COUNT} templates`, 'Preview at three screen sizes', 'Private until you publish'].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check size={12} className="shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link to="/templates" className="btn-secondary">
                Browse templates
              </Link>
              <Link to={startHref} className="btn-primary">
                <PenLine size={15} aria-hidden="true" />
                Create your portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
