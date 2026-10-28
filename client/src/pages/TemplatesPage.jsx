import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Layers, Palette, Wand2 } from 'lucide-react';
import TemplateGallery from '../components/templates/TemplateGallery.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { TEMPLATE_COUNT, PREMIUM_TEMPLATE_COUNT, FREE_TEMPLATE_COUNT, TEMPLATE_LAYOUTS } from '../data/templateCatalogue.js';
import { TEMPLATE_STYLES } from '../data/templateStyles.js';

const HIGHLIGHTS = [
  { icon: Layers, label: `${TEMPLATE_LAYOUTS.length} layouts`, detail: 'Stack, split, bento, gallery, poster, terminal, magazine, timeline, showcase and mosaic.' },
  { icon: Palette, label: `${TEMPLATE_STYLES.length} visual styles`, detail: 'Minimal, glass, neumorphic, brutalist, cinematic, editorial, gradient and more.' },
  { icon: Wand2, label: 'One content model', detail: 'Switch templates at any time — your writing, projects and links carry over.' },
];

export default function TemplatesPage() {
  const { user} = useAuth();
  const [params] = useSearchParams();

  const initialFilters = useMemo(
    () => ({
      search: params.get('q') || '',
      category: params.get('category') || 'All',
      style: params.get('style') || 'All',
      appearance: params.get('appearance') || 'all',
      access: params.get('access') || 'all',
      sort: params.get('sort') || 'featured',
    }),
    [params]
  );

  return (
    <div>
      {/* ----------------------------------------------------------- Hero */}
      <section className="border-b border-line">
        <div className="container-wide py-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-faint">Templates</p>
              <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[30px]">
                All templates
              </h1>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">
                {TEMPLATE_COUNT} designs built from ten layouts and ten visual styles. {FREE_TEMPLATE_COUNT} are free
                forever; {PREMIUM_TEMPLATE_COUNT} are part of Premium.
              </p>
            </div>
            <Link to={user ? '/dashboard/builder' : '/signup'} className="btn-primary shrink-0">
              {user ? 'Start a portfolio' : 'Start free'}
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Gallery */}
      <section className="container-wide py-6">
        <TemplateGallery
          key={JSON.stringify(initialFilters)}
          mode="marketing"
          initialFilters={initialFilters}
        />
      </section>

      {/* --------------------------------------------------- How designs work */}
      <section className="border-t border-line">
        <div className="container-wide py-14">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="eyebrow">Under the hood</p>
              <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.025em] text-ink">
                Layout × style, not one design renamed {TEMPLATE_COUNT} times.
              </h2>
              <p className="mt-3 max-w-lg text-[14px] leading-7 text-muted">
                Each template pairs a structural layout with a visual style. The layout decides where your work appears;
                the style decides typography, colour, radii and surface treatment. Both are implemented as real
                components, so the gallery preview is the design you publish.
              </p>
              <p className="mt-3 max-w-lg text-[14px] leading-7 text-muted">
                Your content — profile, projects, experience, education, links — stays identical when you switch
                designs. The accent colour remains editable on top.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="surface-card p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent-hover">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-[13.5px] font-semibold text-ink">{label}</p>
                  <p className="mt-1 text-[12px] leading-5 text-muted">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-faint">Layouts</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {TEMPLATE_LAYOUTS.map((layout) => (
                  <li key={layout.id} className="rounded-md border border-line bg-canvas px-3 py-2">
                    <p className="text-[12.5px] font-medium text-ink">{layout.label}</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{layout.blurb}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-faint">Styles</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {TEMPLATE_STYLES.map((style) => (
                  <li key={style.id} className="flex items-center gap-2.5 rounded-md border border-line bg-canvas px-3 py-2">
                    <span className="flex shrink-0 gap-1" aria-hidden="true">
                      {[style.preview[0], style.tokens.surfaceAccent, style.preview[1]].map((color, index) => (
                        <span key={index} className="h-4 w-2.5 rounded-sm border border-black/10" style={{ background: color }} />
                      ))}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium text-ink">{style.label}</span>
                      <span className="block truncate text-[11px] text-muted">{style.appearance === 'dark' ? 'Dark' : 'Light'} appearance</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
