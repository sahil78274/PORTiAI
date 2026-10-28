import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, FileText, Monitor, Palette, PenLine, Rows3, Wand2 } from 'lucide-react';
import TemplateGallery from '../components/templates/TemplateGallery.jsx';
import TemplateThumb from '../components/templates/TemplateThumb.jsx';
import { TEMPLATE_CATALOGUE, TEMPLATE_COUNT, PREMIUM_TEMPLATE_COUNT, FREE_TEMPLATE_COUNT } from '../data/templateCatalogue.js';
import { TEMPLATE_STYLES } from '../data/templateStyles.js';
import { filterTemplates } from '../utils/templateQuery.js';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = [
  {
    title: 'Pick a template',
    body: `Browse ${TEMPLATE_COUNT} designs, preview each and start from the one that fits.`,
  },
  {
    title: 'Make it yours',
    body: 'Write your introduction, add projects, skills and experience. Every change appears in the live preview.',
  },
  {
    title: 'Publish a link',
    body: 'Publish to /p/your-name and share it. Edit and unpublish whenever you like.',
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
    body: 'Check the real template at desktop, tablet and mobile width before you publish.',
  },
  {
    icon: Rows3,
    title: 'Project management',
    body: 'Add, edit and reorder projects with optional live and source links, without touching the layout.',
  },
  {
    icon: Wand2,
    title: 'AI-assisted writing',
    body: 'Turn notes into a summary or project description. The model works only from facts you supply.',
  },
];

export default function Landing() {
  const location = useLocation();
  const { user } = useAuth();
  const startHref = user ? '/dashboard/create' : '/signup';

  const strip = useMemo(() => filterTemplates(TEMPLATE_CATALOGUE, { sort: 'featured' }).slice(0, 3), []);

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
      {/* ------------------------------------------------------------- Intro */}
      <section className="border-b border-line">
        <div className="container-wide pb-10 pt-12 sm:pt-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-faint">
                {TEMPLATE_COUNT} templates · {FREE_TEMPLATE_COUNT} free · {TEMPLATE_STYLES.length} visual styles
              </p>
              <h1 className="mt-3 text-balance text-[32px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[42px]">
                A portfolio that looks like the work you do.
              </h1>
              <p className="mt-3 max-w-xl text-[14.5px] leading-6 text-muted">
                Start from a real design, edit your content in a live editor, and publish a link you control.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Link to={startHref} className="btn-primary btn-lg">
                  Start free
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link to="/templates" className="btn-secondary btn-lg">
                  Browse all {TEMPLATE_COUNT}
                </Link>
              </div>

              <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {[`${FREE_TEMPLATE_COUNT} free templates`, 'Live previews', 'No card required'].map((point) => (
                  <li key={point} className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                    <Check size={12} className="shrink-0 text-accent" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Three real templates, full-bleed, immediately in view. */}
            <div className="grid w-full grid-cols-3 gap-2.5 lg:max-w-[520px]">
              {strip.map((template) => (
                <Link
                  key={template.id}
                  to={`/templates/${template.id}`}
                  className="group overflow-hidden rounded-md border border-line bg-surface transition-colors hover:border-lineStrong"
                >
                  <div className="border-b border-line">
                    <TemplateThumb template={template} designWidth={820} designHeight={1040} />
                  </div>
                  <span className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <span className="truncate text-[11px] font-medium text-inkSoft transition-colors group-hover:text-ink">
                      {template.name}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-faint">
                      {template.tier === 'free' ? 'Free' : 'Paid'}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Gallery */}
      <section id="templates" className="border-b border-line">
        <div className="container-wide py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-ink">Pick a starting point</h2>
              <p className="mt-1 text-[13px] text-muted">
                Every card is the real design. Preview it, then use it — your content carries over if you switch later.
              </p>
            </div>
            <Link to="/templates" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink hover:text-accent-hover">
              Open the gallery
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6">
            <TemplateGallery mode="marketing" />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- How it works */}
      <section id="how-it-works" className="border-b border-line">
        <div className="container-wide py-12">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-ink">Three steps, no design tools.</h2>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">
                Drafts stay saved to your account, so you can stop after any step and come back later.
              </p>
            </div>

            <ol className="grid gap-6 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2 text-[13.5px] font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Features */}
      <section id="features" className="border-b border-line">
        <div className="container-wide py-12">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
            <div>
              <p className="eyebrow">The product</p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-ink">More than a pretty template.</h2>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">
                Writing, layout, review and publishing — each part kept straightforward.
              </p>
              <Link to="/features" className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-ink hover:text-accent-hover">
                See all features
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="border-t border-line pt-4">
                  <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                    <Icon size={14} className="text-accent" aria-hidden="true" />
                    {title}
                  </span>
                  <p className="mt-1.5 text-[12.5px] leading-6 text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Styles */}
      <section className="border-b border-line">
        <div className="container-wide py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Visual styles</p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-ink">Pick the register, not just the layout.</h2>
            </div>
            <Link to="/templates" className="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink hover:text-accent-hover">
              <Palette size={13} aria-hidden="true" />
              Filter by style
            </Link>
          </div>

          <div className="mt-6 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {TEMPLATE_STYLES.map((style) => (
              <Link
                key={style.id}
                to={`/templates?style=${style.id}`}
                className="group flex items-center gap-2.5 bg-surface p-3 transition-colors hover:bg-surfaceRaised"
              >
                <span
                  className="h-8 w-8 shrink-0 rounded border border-black/10"
                  style={{
                    background: style.preview[0].startsWith('#') ? style.preview[0] : undefined,
                    backgroundImage:
                      style.tokens.bg.startsWith('linear') || style.tokens.bg.startsWith('radial') ? style.tokens.bg : undefined,
                  }}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium text-ink">{style.label}</span>
                  <span className="block text-[10.5px] text-faint">{style.appearance === 'dark' ? 'Dark' : 'Light'}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Pricing */}
      <section className="border-b border-line">
        <div className="container-wide py-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <div>
              <p className="eyebrow">Plans</p>
              <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-ink">
                Free to start. Premium for the full catalogue.
              </h2>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">
                Premium unlocks the {PREMIUM_TEMPLATE_COUNT} premium designs. Everything you already get on Free stays
                exactly as it is.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface-card p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[14.5px] font-semibold text-ink">Free</h3>
                  <p className="text-[12.5px] text-muted">₹0 forever</p>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {[`${FREE_TEMPLATE_COUNT} original templates`, 'Full editor and live previews', 'AI writing assistance', 'One public link'].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[12.5px] leading-5 text-inkSoft">
                      <Check size={13} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={startHref} className="btn-secondary mt-4 w-full justify-center">
                  Start free
                </Link>
              </div>

              <div className="surface-card border-accent-line p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[14.5px] font-semibold text-ink">Premium</h3>
                  <p className="text-[12.5px] text-muted">Unlocks every design</p>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {[`All ${TEMPLATE_COUNT} templates`, 'Ten layouts × ten styles', 'New templates as they ship', 'Everything in Free'].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[12.5px] leading-5 text-inkSoft">
                      <Check size={13} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/premium" className="btn-primary mt-4 w-full justify-center">
                  See Premium
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Final CTA */}
      <section>
        <div className="container-wide flex flex-col items-start justify-between gap-5 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Ready to show your work?</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-muted">
              Create an account, pick a design and publish a portfolio you can share today.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to="/templates" className="btn-secondary">
              Browse templates
            </Link>
            <Link to={startHref} className="btn-primary">
              <PenLine size={14} aria-hidden="true" />
              Create your portfolio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
