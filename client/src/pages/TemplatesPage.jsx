import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import TemplateShowcase from '../components/marketing/TemplateShowcase.jsx';
import { TEMPLATES } from '../utils/templates.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TemplatesPage() {
  const { user } = useAuth();

  return (
    <div>
      <section className="border-b border-line bg-gradient-to-b from-white to-canvasAlt/20">
        <div className="container-page py-14 sm:py-16">
          <p className="eyebrow">Design Archetypes</p>
          <h1 className="mt-2.5 max-w-2xl text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Choose a layout tailored to your specialty
          </h1>
          <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-inkSoft">
            All three templates read the exact same underlying portfolio data, so switching between designs never costs
            you content. You can fine-tune accent colors, font stacks, density, and section ordering.
          </p>
          {user ? (
            <Link to="/dashboard/create" className="btn-primary mt-7">
              <span>Start a portfolio</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            <Link to="/register" className="btn-primary mt-7">
              <span>Create an account</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <TemplateShowcase heading={false} />

      <section className="container-page pb-20">
        <div className="max-w-xl">
          <p className="eyebrow">Direct Comparison</p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-ink">What changes between templates</h2>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-line shadow-card bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Template comparison</caption>
            <thead className="bg-slate-50 text-2xs uppercase tracking-wider text-muted border-b border-line">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Aspect</th>
                {TEMPLATES.map((template) => (
                  <th key={template.id} scope="col" className="px-5 py-3 font-semibold text-ink">
                    {template.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              <tr>
                <th scope="row" className="px-5 py-3.5 text-left font-semibold text-slate-800">Layout</th>
                <td className="px-5 py-3.5 text-inkSoft">Single column, balanced margins</td>
                <td className="px-5 py-3.5 text-inkSoft">Sticky dark sidebar + project grid</td>
                <td className="px-5 py-3.5 text-inkSoft">Asymmetric editorial column grid</td>
              </tr>
              <tr>
                <th scope="row" className="px-5 py-3.5 text-left font-semibold text-slate-800">Typographic voice</th>
                <td className="px-5 py-3.5 text-inkSoft">Serif headings, quiet recruiter-friendly body</td>
                <td className="px-5 py-3.5 text-inkSoft">Monospace labels, technical terminal accents</td>
                <td className="px-5 py-3.5 text-inkSoft">Large display serif, numbered section indices</td>
              </tr>
              <tr>
                <th scope="row" className="px-5 py-3.5 text-left font-semibold text-slate-800">Best for</th>
                {TEMPLATES.map((template) => (
                  <td key={template.id} className="px-5 py-3.5 text-inkSoft">{template.bestFor}</td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="px-5 py-3.5 text-left font-semibold text-slate-800">Customisation</th>
                {TEMPLATES.map((template) => (
                  <td key={template.id} className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Check size={12} strokeWidth={2.5} aria-hidden="true" /> Accent, font, density, sections
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3.5 text-xs text-muted">
          Templates are responsive React components rendering saved portfolio data; layouts adapt seamlessly across mobile, tablet, and desktop viewports.
        </p>
      </section>
    </div>
  );
}
