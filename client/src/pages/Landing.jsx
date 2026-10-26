import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Palette,
  Gauge,
  Smartphone,
  Globe2,
  Newspaper,
  LayoutTemplate,
  Wand2,
  ShieldCheck,
  Check,
  X as CloseIcon,
  ChevronDown,
  Zap,
  Lock,
  MousePointerClick,
  FileText,
  Rocket,
  Star,
} from 'lucide-react';
import HeroMockup from '../components/marketing/HeroMockup.jsx';
import TemplateCard, { TemplatePreviewModal } from '../components/templates/TemplateCard.jsx';
import { SectionHeading } from '../components/ui/Kit.jsx';
import { TEMPLATES } from '../utils/templates.js';
import { demoAnalysis } from '../utils/demoPortfolio.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI portfolio generation',
    description:
      'Describe your work in plain language. The builder drafts your summary, project write-ups and skill list from the facts you provide — never invented ones.',
    tone: 'from-brand-indigo/25',
  },
  {
    icon: Palette,
    title: 'Deep customisation',
    description:
      'Nine distinct design systems, accent colours, typography, spacing density and full section control. Every change renders live in the preview.',
    tone: 'from-brand-violet/25',
  },
  {
    icon: Gauge,
    title: 'Honest portfolio analyser',
    description:
      'A documented 100-point rubric scores completeness, clarity and contactability. Optional AI feedback is clearly labelled and never affects the score.',
    tone: 'from-brand-blue/25',
  },
  {
    icon: Smartphone,
    title: 'Responsive by default',
    description:
      'Every template is built mobile-first and checked at desktop, tablet and mobile breakpoints inside the editor’s preview panel.',
    tone: 'from-brand-cyan/25',
  },
  {
    icon: Globe2,
    title: 'One-link publishing',
    description:
      'Publish to a clean public URL the moment your draft is ready. Unpublish or republish instantly — the link stays yours.',
    tone: 'from-emerald-500/25',
  },
  {
    icon: Newspaper,
    title: 'Built-in blog',
    description:
      'Write in Markdown with AI writing help, keep drafts private, then publish a matching blog page inside your portfolio.',
    tone: 'from-amber-500/25',
  },
];

const STEPS = [
  {
    icon: Sparkles,
    step: '01',
    title: 'Describe yourself',
    detail:
      'Chat with the AI builder. It asks about your role, projects, skills, experience, education and links, then turns your answers into portfolio copy.',
    bullets: ['Guided conversation', 'Content you can edit', 'Nothing invented'],
  },
  {
    icon: LayoutTemplate,
    step: '02',
    title: 'Choose a design',
    detail:
      'Preview nine templates live, switch fonts and accents, reorder sections and preview on desktop, tablet or mobile. Your content follows you between designs.',
    bullets: ['9 design systems', 'Live preview', 'Autosave'],
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Publish & share',
    detail:
      'Save a draft, run the analyser, then publish to a private-by-default workspace that becomes a public site with one toggle.',
    bullets: ['Public URL', 'Copy & share', 'Blog optional'],
  },
];

const FAQS = [
  {
    q: 'Is the AI writing real or simulated?',
    a: 'The AI builder calls the Gemini API from the PortiAI backend. Keys never reach the browser. If AI is not configured on the server, the builder keeps your own wording and tells you clearly instead of pretending to generate.',
  },
  {
    q: 'Do I need a card to start?',
    a: 'No. Creating an account, building a portfolio, running the rule-based analyser and publishing are all available on the free tier. Paid plans shown are indicative and checkout is not enabled yet.',
  },
  {
    q: 'Who owns my portfolio content?',
    a: 'You do. Portfolios are stored against your account and every private API route verifies ownership server-side. You can duplicate, unpublish or permanently delete a portfolio, or delete your entire account from Settings.',
  },
  {
    q: 'Can I change templates after writing content?',
    a: 'Yes. Templates read the same underlying data, so switching design never discards content. Accent colour, typography and section order are stored with the portfolio too.',
  },
  {
    q: 'What does the analyser actually measure?',
    a: 'A deterministic rubric scores completeness, summary clarity, project descriptions, skills coverage, education and experience, links and readability. Website scans additionally check SEO, accessibility, responsiveness and performance signals in the delivered HTML.',
  },
  {
    q: 'Where is my portfolio published?',
    a: 'Published portfolios are served by the PortiAI API at /p/your-slug and rendered live from your saved data. The public page is separate from the dashboard and never exposes account details.',
  },
];

const COMPARISON = [
  { label: 'Design system + responsive layouts', alone: false, portiai: true },
  { label: 'Guided content writing', alone: false, portiai: true },
  { label: 'Measured quality feedback', alone: false, portiai: true },
  { label: 'Publish in one click', alone: false, portiai: true },
  { label: 'Blog attached to your portfolio', alone: false, portiai: true },
  { label: 'Switch designs without rewriting', alone: false, portiai: true },
  { label: 'Full data ownership', alone: true, portiai: true },
  { label: 'Time to a finished site', alone: 'Days', portiai: 'Minutes' },
];

function TemplatePreviewSection() {
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const featured = TEMPLATES.filter((template) => ['obsidian', 'aurora', 'swiss', 'neon', 'editorialpro', 'executive'].includes(template.id));

  const useTemplate = (template) => {
    navigate(user ? `/dashboard/builder?template=${template.id}` : `/register?template=${template.id}`);
  };

  return (
    <section id="templates" className="container-wide py-24">
      <SectionHeading
        eyebrow="Template marketplace"
        title="Nine design systems. One body of content."
        description="Each template is a full layout with its own typography, spacing and section treatment — not a recoloured copy. Preview any design with sample content, then make it yours."
        actions={
          <Link to="/templates" className="btn-secondary">
            Browse all templates
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        }
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onPreview={setPreview}
            onUse={useTemplate}
          />
        ))}
      </div>

      <TemplatePreviewModal
        template={preview}
        onClose={() => setPreview(null)}
        onUse={(template) => {
          setPreview(null);
          useTemplate(template);
        }}
        useLabel={user ? 'Build with this template' : 'Create a free account'}
      />
    </section>
  );
}

function AnalyzerShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-white/[0.07] bg-[#060a16] py-24">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-70"
        style={{ background: 'radial-gradient(ellipse 600px 400px at 70% 40%, rgba(99,102,241,0.18), transparent 70%)' }}
        aria-hidden="true"
      />
      <div className="container-wide relative grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Portfolio analyser</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Feedback you can act on, not a vague number.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Every score comes from a published rubric, and each deduction comes with the exact section to fix. Scan
            your own portfolio, another live URL, or upload an HTML file — with clear notes on what the scan could not
            measure.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'Six weighted categories with transparent point values',
              'Issues grouped by severity with concrete recommendations',
              'AI suggestions labelled separately from deterministic checks',
              'Rescan any time to see how your edits changed the score',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-inkSoft">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-successSoft text-success">
                  <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard/analyzer" className="btn-primary">
              <Gauge size={15} aria-hidden="true" />
              Open the analyser
            </Link>
            <Link to="/register" className="btn-secondary">
              Create an account
            </Link>
          </div>
        </div>

        {/* Sample report */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-brand-gradient opacity-10 blur-2xl" aria-hidden="true" />
          <div className="relative rounded-2xl border border-white/10 bg-surface/95 p-5 shadow-float backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">Analysis report</p>
                <p className="mt-1 text-sm font-medium text-white">Sample portfolio · rule-based rubric</p>
              </div>
              <span className="rounded-full border border-warning/25 bg-warningSoft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning">
                Sample
              </span>
            </div>

            <div className="mt-5 flex items-center gap-6">
              <div className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#6366f1 0% 78%, rgba(255,255,255,0.08) 78% 100%)' }}>
                <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-surface">
                  <span className="text-2xl font-bold text-white">{demoAnalysis.score}</span>
                  <span className="text-[9px] uppercase tracking-widest text-faint">of 100</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {demoAnalysis.categories.slice(0, 4).map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center justify-between text-[10px] text-muted">
                      <span className="truncate">{category.label}</span>
                      <span className="font-mono text-inkSoft">{category.score}/{category.max}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-violet"
                        style={{ width: `${(category.score / category.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {demoAnalysis.issues.map((issue) => (
                <div key={issue.id} className="flex items-start gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2">
                  <span
                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      issue.severity === 'high' ? 'bg-danger' : issue.severity === 'medium' ? 'bg-warning' : 'bg-faint'
                    }`}
                    aria-hidden="true"
                  />
                  <p className="text-[11px] leading-relaxed text-inkSoft">{issue.message}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] leading-relaxed text-faint">
              Illustrative sample report using the same rubric as the real analyser. It is not a real user&apos;s result.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: 'Free',
      price: '₹0',
      cadence: 'forever',
      description: 'Everything you need to build and publish a serious portfolio.',
      cta: 'Start building free',
      to: '/register',
      highlight: true,
      badge: 'Available now',
      features: [
        'Up to 3 portfolios',
        'All 9 templates',
        'AI builder (daily request cap)',
        'Rule-based analyser',
        'Public portfolio URL',
        'Blog with Markdown editor',
      ],
    },
    {
      name: 'Pro',
      price: '₹499',
      cadence: 'per month',
      description: 'For freelancers shipping client-ready work every month.',
      cta: 'Start free instead',
      to: '/register',
      badge: 'Coming soon',
      features: [
        'Unlimited portfolios',
        'Higher AI request limits',
        'Custom domain support',
        'Priority analysis queue',
        'PDF export',
        'Email support',
      ],
    },
    {
      name: 'Studio',
      price: '₹1,499',
      cadence: 'per month',
      description: 'For small teams and consultants managing multiple profiles.',
      cta: 'Start free instead',
      to: '/register',
      badge: 'Coming soon',
      features: [
        'Everything in Pro',
        'Team workspaces',
        'Client handover links',
        'Brand presets',
        'Usage analytics',
        'Priority support',
      ],
    },
  ];

  return (
    <section id="pricing" className="container-wide py-24">
      <SectionHeading
        eyebrow="Pricing"
        align="center"
        title="Start free. Upgrade when it earns it."
        description="The free tier is a complete product, not a trial. Paid plans below are indicative — billing is not enabled in this build and no card details are accepted."
      />

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl border p-6 ${
              plan.highlight
                ? 'gradient-border shadow-glow'
                : 'border-line bg-surface/70'
            }`}
          >
            {plan.highlight ? (
              <span className="absolute -top-3 left-6 rounded-full bg-brand-gradient px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Recommended
              </span>
            ) : null}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <span className={`badge ${plan.highlight ? 'border-success/25 bg-successSoft text-success' : 'border-lineStrong bg-white/[0.04] text-faint'}`}>
                {plan.badge}
              </span>
            </div>
            <div className="mt-4 flex items-end gap-1.5">
              <span className="font-display text-4xl font-bold tracking-tight text-white">{plan.price}</span>
              <span className="pb-1 text-xs text-faint">{plan.cadence}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{plan.description}</p>

            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-inkSoft">
                  <Check size={14} className={plan.highlight ? 'mt-0.5 shrink-0 text-success' : 'mt-0.5 shrink-0 text-accent-hover'} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link to={plan.to} className={`mt-7 w-full justify-center ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-faint">
        Prices shown are illustrative product planning figures for this build. No payment provider is connected, and
        the Pro and Studio features are not yet implemented.
      </p>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section id="faq" className="container-wide py-24">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Questions, answered honestly.</h2>
          <p className="mt-3.5 text-base leading-relaxed text-muted">
            No invented testimonials or customer numbers anywhere on this page. If something is not built yet, it says so.
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-surface/60 p-4">
            <ShieldCheck size={18} className="text-success" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted">
              Authentication uses bcrypt hashing and HTTP-only session cookies; API keys stay on the server.
            </p>
          </div>
        </div>

        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface/60">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <span className={`text-sm font-semibold ${isOpen ? 'text-white' : 'text-inkSoft'}`}>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-faint transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent-hover' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen ? <p className="px-5 pb-5 text-sm leading-relaxed text-muted animate-fadeIn">{faq.a}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const id = location.hash?.replace('#', '');
    const timer = setTimeout(() => {
      const element = id ? document.getElementById(id) : null;
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (!id) window.scrollTo({ top: 0 });
    }, 60);
    return () => clearTimeout(timer);
  }, [location.hash, location.pathname]);

  const primaryTo = user ? '/dashboard/builder' : '/register';
  const [showTour, setShowTour] = useState(false);

  return (
    <div className="overflow-hidden">
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[720px] opacity-90"
          style={{ background: 'radial-gradient(ellipse 900px 520px at 50% -8%, rgba(99,102,241,0.30), transparent 70%)' }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[820px] -translate-x-1/2 opacity-40 blur-3xl"
          style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.35), rgba(168,85,247,0.35))' }}
          aria-hidden="true"
        />

        <div className="container-wide relative pb-16 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-1.5 text-[11px] font-medium text-inkSoft backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-hover opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              AI-native portfolio platform
              <span className="h-3 w-px bg-white/15" aria-hidden="true" />
              <span className="text-faint">9 templates</span>
            </div>

            <h1 className="mt-6 text-balance text-[40px] font-bold leading-[1.05] tracking-[-0.04em] text-white sm:text-[62px] lg:text-[70px]">
              Build Your Professional Portfolio with{' '}
              <span className="relative inline-block">
                <span className="gradient-text">AI</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 120 8" fill="none" aria-hidden="true">
                  <path d="M2 6C22 2 60 1 118 4" stroke="url(#underline)" strokeWidth="2.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline" x1="0" y1="0" x2="120" y2="0">
                      <stop stopColor="#3b82f6" />
                      <stop offset="0.5" stopColor="#6366f1" />
                      <stop offset="1" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted sm:text-lg">
              Create, customize, and publish a stunning professional portfolio in minutes using the power of AI.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={primaryTo} className="btn-primary btn-lg w-full sm:w-auto">
                <Sparkles size={17} aria-hidden="true" />
                Start Building with AI
              </Link>
              <Link to="/templates" className="btn-secondary btn-lg w-full sm:w-auto">
                <LayoutTemplate size={16} aria-hidden="true" />
                Explore Templates
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-faint">
              {[
                { icon: Lock, label: 'No card required' },
                { icon: ShieldCheck, label: 'You own your data' },
                { icon: Zap, label: 'Publish in one link' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Icon size={12} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto mt-14 max-w-6xl">
            <HeroMockup />
          </div>

          {/* Illustrative platform facts */}
          <div className="mt-14 grid gap-4 rounded-2xl border border-line bg-surface/50 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: '9', label: 'distinct templates' },
              { value: '100', label: 'point analysis rubric' },
              { value: '3', label: 'preview breakpoints' },
              { value: '0', label: 'API keys in the browser' },
            ].map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p className="font-display text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-faint">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-faint lg:text-left">
            Illustrative product facts, not customer or performance metrics.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section id="features" className="container-wide py-24">
        <SectionHeading
          eyebrow="Platform features"
          title="Everything a portfolio needs, in one studio."
          description="From the first sentence to the public URL, PortiAI handles the parts that usually stall a portfolio: writing, design decisions, quality checks and publishing."
          align="center"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, tone }) => (
            <div key={title} className="card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lineStrong hover:bg-surfaceRaised/80">
              <div className={`pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${tone} to-transparent blur-2xl opacity-60 transition-opacity duration-300 group-hover:opacity-100`} aria-hidden="true" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-accent-hover">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="relative mt-5 text-base font-semibold text-white">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <TemplatePreviewSection />
      <AnalyzerShowcase />

      {/* ------------------------------------------------------------ How it works */}
      <section id="how-it-works" className="container-wide py-24">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from scattered notes to a live portfolio."
          description="No blank-page paralysis. The builder asks the right questions, the templates handle layout, and publishing is a single toggle."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, detail, bullets }, index) => (
            <div key={step} className="relative card p-6">
              {index < STEPS.length - 1 ? (
                <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-lineStrong lg:block" aria-hidden="true" />
              ) : null}
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="font-mono text-2xs tracking-[0.2em] text-faint">{step}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{detail}</p>
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-xs text-inkSoft">
                    <Check size={12} className="text-success" aria-hidden="true" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to={primaryTo} className="btn-primary">
            <Wand2 size={15} aria-hidden="true" />
            Open the AI builder
          </Link>
          <button type="button" onClick={() => setShowTour((value) => !value)} className="btn-ghost">
            <MousePointerClick size={15} aria-hidden="true" />
            {showTour ? 'Hide product notes' : 'What makes it different?'}
          </button>
        </div>

        {showTour ? (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-accent-line/40 bg-accent-soft/40 p-5 text-sm leading-relaxed text-inkSoft animate-fadeUp">
            <p className="font-semibold text-white">Built to be honest about what it does.</p>
            <p className="mt-2">
              Scores come from a documented rubric, not an opaque prompt. AI-written text is labelled as AI-written.
              Website scans report exactly which checks they could not run. Nothing on this page claims customers,
              revenue or benchmarks that do not exist.
            </p>
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------------ Comparison */}
      <section className="border-y border-white/[0.07] bg-[#060a16] py-24">
        <div className="container-wide grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Why PortiAI</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              The difference is the boring part, done properly.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Most portfolios fail on structure and specificity, not visual taste. PortiAI enforces the structure,
              prompts for specifics, and tells you plainly where the page is thin.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                { icon: FileText, title: 'Content-first AI', text: 'Prompts grounded in your facts, not generic filler.' },
                { icon: Gauge, title: 'Measured, not guessed', text: 'Every score maps to a rule you can read.' },
                { icon: Globe2, title: 'Real public pages', text: 'Rendered from saved data at a stable URL.' },
                { icon: Star, title: 'No dark patterns', text: 'No fake testimonials, no invented urgency.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-xl border border-line bg-surface/60 p-4">
                  <Icon size={16} className="text-accent-hover" aria-hidden="true" />
                  <p className="mt-2.5 text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-surface/70">
            <div className="grid grid-cols-[1fr_100px_100px] border-b border-line bg-canvasDeep/60 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              <span>Capability</span>
              <span className="text-center">From scratch</span>
              <span className="text-center text-accent-hover">PortiAI</span>
            </div>
            {COMPARISON.map((row) => (
              <div key={row.label} className="grid grid-cols-[1fr_100px_100px] items-center border-b border-line/60 px-5 py-3 last:border-0">
                <span className="text-sm text-inkSoft">{row.label}</span>
                <span className="flex justify-center text-xs text-faint">
                  {typeof row.alone === 'boolean' ? (
                    row.alone ? <Check size={14} className="text-muted" aria-label="Yes" /> : <CloseIcon size={14} className="text-faint/70" aria-label="No" />
                  ) : (
                    row.alone
                  )}
                </span>
                <span className="flex justify-center text-xs font-medium text-white">
                  {typeof row.portiai === 'boolean' ? (
                    <Check size={14} className="text-success" aria-label="Yes" />
                  ) : (
                    row.portiai
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* ------------------------------------------------------------ Final CTA */}
      <section className="container-wide pb-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 px-6 py-16 text-center sm:px-12">
          <div className="absolute inset-0 bg-brand-gradient opacity-[0.14]" aria-hidden="true" />
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.45), transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-inkSoft">
              <Sparkles size={12} aria-hidden="true" />
              Your next opportunity starts here
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-white sm:text-[44px] sm:leading-[1.1]">
              Your work deserves a portfolio that looks like you meant it.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-inkSoft">
              Build with AI, refine with real feedback, publish on your own link. Free to start, no card required.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={primaryTo} className="btn-primary btn-lg w-full sm:w-auto">
                Start Building with AI
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/templates" className="btn-secondary btn-lg w-full sm:w-auto">
                Explore Templates
              </Link>
            </div>
            <p className="mt-5 text-[11px] text-faint">
              Sample portfolios shown across PortiAI use illustrative demo content, never real customer data.
            </p>
          </div>
        </div>
      </section>

      <FaqSection />

      <div className="container-wide pb-4">
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-faint">
          PortiAI is an independently built portfolio platform. Feature notes on this page describe what is actually
          implemented in this codebase; paid tiers and custom domains are marked as future work.
        </p>
      </div>
    </div>
  );
}
