import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import TemplateShowcase from '../components/marketing/TemplateShowcase.jsx';
import { TEMPLATES } from '../utils/templates.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TemplatesPage() {
  const { user } = useAuth();

  return (
    <div>
      <section className="border-b border-line">
        <div className="container-page py-12 sm:py-14">
          <p className="eyebrow">Templates</p>
          <h1 className="mt-2 max-w-2xl text-3xl sm:text-4xl">Choose a layout that fits the work</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-inkSoft">
            All three templates read the same portfolio data, so switching never costs you content. You can also change
            accent colour, font stack and section order in the editor.
          </p>
          {user ? (
            <Link to="/dashboard/create" className="btn-primary mt-6">
              Start a portfolio <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            <Link to="/register" className="btn-primary mt-6">
              Create an account <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <TemplateShowcase heading={false} />

      <section className="container-page pb-16">
        <h2 className="text-xl">What changes between templates</h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Template comparison</caption>
            <thead className="bg-canvasAlt/70 text-2xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Aspect</th>
                {TEMPLATES.map((template) => (
                  <th key={template.id} scope="col" className="px-3 py-2 font-medium">
                    {template.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              <tr>
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-ink">Layout</th>
                <td className="px-3 py-2.5 text-inkSoft">Single column</td>
                <td className="px-3 py-2.5 text-inkSoft">Sticky rail + main</td>
                <td className="px-3 py-2.5 text-inkSoft">Asymmetric editorial grid</td>
              </tr>
              <tr>
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-ink">Typographic voice</th>
                <td className="px-3 py-2.5 text-inkSoft">Serif headings, quiet body</td>
                <td className="px-3 py-2.5 text-inkSoft">Monospace labels, technical</td>
                <td className="px-3 py-2.5 text-inkSoft">Display serif, numbered sections</td>
              </tr>
              <tr>
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-ink">Best for</th>
                {TEMPLATES.map((template) => (
                  <td key={template.id} className="px-3 py-2.5 text-inkSoft">{template.bestFor}</td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="px-3 py-2.5 text-left font-medium text-ink">Customisation</th>
                {TEMPLATES.map((template) => (
                  <td key={template.id} className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs text-success">
                      <Check size={12} aria-hidden="true" /> Accent, font, density, sections
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Templates are React components that render saved portfolio data; there is no drag-and-drop page builder, by
          design.
        </p>
      </section>
    </div>
  );
}
