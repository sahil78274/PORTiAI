import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, Monitor, Smartphone, Tablet } from 'lucide-react';
import TemplateLivePreview from '../components/templates/TemplateLivePreview.jsx';
import PremiumDialog from '../components/templates/PremiumDialog.jsx';
import TemplateCard from '../components/templates/TemplateCard.jsx';
import { TemplatePreviewModal } from '../components/templates/TemplateCard.jsx';
import { TEMPLATE_CATALOGUE, getCatalogueTemplate } from '../data/templateCatalogue.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { portfolioService } from '../services/portfolioService.js';
import { ApiError } from '../services/api.js';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
  { id: 'tablet', label: 'Tablet', Icon: Tablet },
  { id: 'mobile', label: 'Mobile', Icon: Smartphone },
];

export default function TemplatePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, isPremium } = useAuth();
  const template = getCatalogueTemplate(id);

  const [device, setDevice] = useState('desktop');
  const [creating, setCreating] = useState(false);
  const [upgradeFor, setUpgradeFor] = useState(null);
  const [modalPreview, setModalPreview] = useState(null);

  const related = useMemo(() => {
    if (!template) return [];
    return TEMPLATE_CATALOGUE.filter(
      (item) => item.id !== template.id && (item.layout === template.layout || item.style === template.style)
    ).slice(0, 3);
  }, [template]);

  if (!template) {
    return (
      <div className="container-wide py-24 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-hover">Template not found</p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-ink">That template id is not in the catalogue.</h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-muted">
          The link may be out of date. Browse the gallery to see every available design.
        </p>
        <Link to="/templates" className="btn-primary mt-6 inline-flex">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to templates
        </Link>
      </div>
    );
  }

  const locked = template.tier === 'premium' && !isPremium;

  const startWith = async (nextTemplate) => {
    if (!nextTemplate) return;
    if (nextTemplate.tier === 'premium' && !isPremium) {
      setModalPreview(null);
      setUpgradeFor(nextTemplate);
      return;
    }
    if (!user) {
      navigate(`/signup?template=${encodeURIComponent(nextTemplate.id)}`);
      return;
    }
    setCreating(true);
    try {
      const data = await portfolioService.create({
        templateId: nextTemplate.id,
        title: `${nextTemplate.name} portfolio`,
      });
      toast.success(`${nextTemplate.name} selected.`, { description: 'Opening the editor with your new draft.' });
      navigate(`/dashboard/portfolio/${data.portfolio.id}/edit`);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'PREMIUM_REQUIRED') {
        setUpgradeFor(nextTemplate);
      } else {
        toast.error(error.message || 'Could not create a portfolio with that template.');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <section className="border-b border-line hero-glow">
        <div className="container-wide py-8 sm:py-10">
          <nav aria-label="Breadcrumb" className="text-[12.5px] text-muted">
            <Link to="/templates" className="transition-colors hover:text-ink">
              Templates
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span className="text-inkSoft">{template.name}</span>
          </nav>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={template.tier === 'free' ? 'badge-free' : 'badge-premium'}>
                  {locked ? <Lock size={10} aria-hidden="true" /> : null}
                  {template.tier === 'free' ? 'Free' : 'Premium'}
                </span>
                <span className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
                  {template.category}
                </span>
                <span className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
                  {template.layoutLabel} layout
                </span>
                <span className="rounded border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-muted">
                  {template.styleLabel}
                </span>
              </div>
              <h1 className="mt-4 text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[40px]">
                {template.name}
              </h1>
              <p className="mt-3 text-[14.5px] leading-7 text-muted">{template.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" onClick={() => setModalPreview(template)} className="btn-secondary">
                Quick preview
              </button>
              <button type="button" onClick={() => startWith(template)} disabled={creating} className="btn-primary btn-lg">
                {locked ? <Lock size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
                {creating ? 'Preparing…' : locked ? 'Unlock template' : 'Use this template'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <p className="text-[12.5px] text-muted">Live preview · sample content · same component as the published page</p>
          <div className="flex items-center gap-0.5 rounded-md border border-line bg-surface p-0.5" role="group" aria-label="Preview width">
            {DEVICES.map(({ id: deviceId, label, Icon }) => (
              <button
                key={deviceId}
                type="button"
                onClick={() => setDevice(deviceId)}
                aria-pressed={device === deviceId}
                aria-label={`${label} preview`}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                  device === deviceId ? 'bg-accent text-accent-contrast' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon size={13} aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-canvas">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2 text-[11.5px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              {template.name}
            </span>
            <span className="font-mono">{device === 'desktop' ? '1280' : device === 'tablet' ? '834' : '430'}px</span>
          </div>
          <TemplateLivePreview template={template} device={device} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="surface-card p-5">
            <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">What you get with this design</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                'Editable profile, summary and biography',
                'Projects with stack tags and links',
                'Experience, education and achievements',
                'Skills, contact details and social links',
                'Desktop, tablet and mobile layouts',
                'Switch templates without rewriting content',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] leading-5 text-inkSoft">
                  <Check size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {template.tags.slice(0, 8).map((tag) => (
                <span key={tag} className="rounded border border-line bg-canvas px-2 py-0.5 text-[11px] text-muted">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <aside className="space-y-3">
            <div className="surface-card p-5">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-faint">Design</p>
              <dl className="mt-3 space-y-2 text-[12.5px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Layout</dt>
                  <dd className="font-medium text-ink">{template.layoutLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Style</dt>
                  <dd className="font-medium text-ink">{template.styleLabel}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Appearance</dt>
                  <dd className="font-medium capitalize text-ink">{template.appearance}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Access</dt>
                  <dd className="font-medium text-ink">{template.tier === 'free' ? 'Free' : 'Premium'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Palette</dt>
                  <dd className="flex gap-1" aria-hidden="true">
                    {template.swatches.map((color, index) => (
                      <span key={index} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: color }} />
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
            <Link to="/templates" className="btn-secondary w-full justify-center">
              <ArrowLeft size={13} aria-hidden="true" />
              All templates
            </Link>
          </aside>
        </div>

        {related.length ? (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">More like this</p>
                <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.02em] text-ink">
                  Same {related[0].layout === template.layout ? 'layout' : 'style'}, different direction
                </h2>
              </div>
              <Link to="/templates" className="btn-secondary btn-sm">
                Browse all
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => (
                <TemplateCard
                  key={item.id}
                  template={item}
                  locked={item.tier === 'premium' && !isPremium}
                  onPreview={setModalPreview}
                  onUse={startWith}
                />
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <TemplatePreviewModal
        template={modalPreview}
        onClose={() => setModalPreview(null)}
        onUse={startWith}
        locked={modalPreview ? modalPreview.tier === 'premium' && !isPremium : false}
        useLabel="Use this template"
        busy={creating}
      />
      <PremiumDialog template={upgradeFor} open={Boolean(upgradeFor)} onClose={() => setUpgradeFor(null)} />
    </div>
  );
}
