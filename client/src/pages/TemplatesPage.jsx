import { Link } from 'react-router-dom';
import { ArrowRight, Check, LayoutTemplate, Sparkles, Wand2 } from 'lucide-react';
import TemplateGallery from '../components/templates/TemplateGallery.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { TEMPLATES } from '../utils/templates.js';

const ROWS = [
  {
    label: 'Layout architecture',
    values: {
      minimal: 'Single column, serif hierarchy',
      developer: 'Sticky rail + project feed',
      editorial: 'Numbered asymmetric grid',
      obsidian: 'Minimal hero, numbered sections',
      aurora: 'Centred hero, glass cards',
      swiss: 'Twelve-column editorial grid',
      neon: 'Terminal window chrome',
      editorialpro: 'Image-led magazine spreads',
      executive: 'Formal two-tone hierarchy',
    },
  },
  {
    label: 'Typographic voice',
    values: {
      minimal: 'Serif headings, quiet body',
      developer: 'Monospace labels, technical',
      editorial: 'Display serif, editorial',
      obsidian: 'Tight sans, restrained',
      aurora: 'Gradient display sans',
      swiss: 'Black grotesque, rigid',
      neon: 'Monospace terminal',
      editorialpro: 'Elegant serif, warm',
      executive: 'Refined serif, formal',
    },
  },
];

export default function TemplatesPage() {
  const { user } = useAuth();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/[0.07]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{ background: 'radial-gradient(ellipse 800px 400px at 50% -10%, rgba(99,102,241,0.25), transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="container-wide relative py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-inkSoft">
            <LayoutTemplate size={12} aria-hidden="true" />
            Template marketplace
          </span>
          <h1 className="mt-5 max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Nine design systems, built for different kinds of work.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Each template is a complete layout with its own typography and rhythm — not a recoloured copy. Preview any
            design live with sample content, then switch between them without losing a word.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to={user ? '/dashboard/builder' : '/register'} className="btn-primary">
              <Sparkles size={15} aria-hidden="true" />
              {user ? 'Open the AI builder' : 'Start building free'}
            </Link>
            {user ? (
              <Link to="/dashboard/templates" className="btn-secondary">
                Use a template in your workspace
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-faint">
            {['Live rendered previews', 'Responsive layouts', 'Accent, font & density controls', 'Section reordering'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check size={11} className="text-success" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-wide py-12">
        <TemplateGallery mode="marketing" />
      </section>

      <section className="border-y border-white/[0.07] bg-[#060a16] py-16">
        <div className="container-wide">
          <div className="max-w-xl">
            <p className="eyebrow">Direct comparison</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">What changes between templates</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">
              Content stays identical across every design; the layout, typography and section treatment change.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <caption className="sr-only">Comparison of the nine portfolio templates</caption>
              <thead className="bg-canvasDeep/60 text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Aspect</th>
                  {TEMPLATES.map((template) => (
                    <th key={template.id} scope="col" className="px-4 py-3 font-semibold text-ink">
                      {template.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ROWS.map((row) => (
                  <tr key={row.label} className="bg-surface/40">
                    <th scope="row" className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold text-white">
                      {row.label}
                    </th>
                    {TEMPLATES.map((template) => (
                      <td key={template.id} className="px-4 py-3.5 text-xs text-muted">
                        {row.values[template.id]}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-surface/40">
                  <th scope="row" className="px-4 py-3.5 text-left text-xs font-semibold text-white">Best for</th>
                  {TEMPLATES.map((template) => (
                    <td key={template.id} className="px-4 py-3.5 text-xs text-muted">
                      {template.bestFor}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-faint">
            Templates are responsive React components rendering your saved portfolio data at desktop, tablet and mobile
            widths.
          </p>
        </div>
      </section>

      <section className="container-wide py-16">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-accent-line/40 bg-gradient-to-br from-accent-soft via-surfaceRaised/50 to-surface p-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-semibold text-white">Not sure which design fits?</p>
            <p className="mt-1 text-sm text-muted">Let the AI builder choose a starting point based on your role and content.</p>
          </div>
          <div className="flex gap-2">
            <Link to={user ? '/dashboard/builder' : '/register'} className="btn-primary">
              <Wand2 size={15} aria-hidden="true" />
              Build with AI
            </Link>
            <Link to="/#pricing" className="btn-secondary">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
