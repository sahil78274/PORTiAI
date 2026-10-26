import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import TemplateGallery from '../components/templates/TemplateGallery.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { TEMPLATES } from '../utils/templates.js';

export default function TemplatesPage() {
  const { user } = useAuth();

  return (
    <div>
      <section className="border-b border-line">
        <div className="container-wide py-14">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-accent-hover">Templates</p>
          <h1 className="mt-3 max-w-2xl text-balance text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[40px]">
            Six portfolio layouts, each built for a different kind of work.
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-muted">
            Every template is a complete design system — layout, typography and section treatment. Your content stays the
            same, so you can switch at any time without rewriting a word.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            {['Live previews with sample content', 'Responsive by default', 'Accent, font and spacing controls'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check size={13} className="text-accent-hover" aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to={user ? '/dashboard/builder' : '/signup'} className="btn-primary">
              {user ? 'Start a portfolio' : 'Create an account'}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            {user ? (
              <Link to="/dashboard/templates" className="btn-secondary">
                Open in your workspace
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-wide py-10">
        <TemplateGallery mode="marketing" />
      </section>

      <section className="border-t border-line bg-surface">
        <div className="container-wide py-12">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em]">What changes between templates</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-7 text-muted">
            The content is identical across all six. Layout, type and section treatment differ.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
              <caption className="sr-only">Comparison of the six portfolio templates</caption>
              <thead className="bg-canvas text-[11px] uppercase tracking-[0.1em] text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Template</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Layout</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Palette</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Best for</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {TEMPLATES.map((template) => (
                  <tr key={template.id}>
                    <th scope="row" className="whitespace-nowrap px-4 py-3 text-left font-medium">{template.name}</th>
                    <td className="px-4 py-3 text-muted">{template.traits.join(' · ')}</td>
                    <td className="px-4 py-3">
                      <span className="flex gap-1" aria-label={`${template.name} palette`}>
                        {template.swatches.map((color) => (
                          <span key={color} className="h-3.5 w-3.5 rounded-full border border-lineStrong" style={{ background: color }} />
                        ))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{template.bestFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
