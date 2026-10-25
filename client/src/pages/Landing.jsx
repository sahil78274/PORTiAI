import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Gauge, CheckCircle2 } from 'lucide-react';
import Hero from '../components/marketing/Hero.jsx';
import ProductTour from '../components/marketing/ProductTour.jsx';
import Features from '../components/marketing/Features.jsx';
import HowItWorks from '../components/marketing/HowItWorks.jsx';
import TemplateShowcase from '../components/marketing/TemplateShowcase.jsx';
import AnalyzerPreview from '../components/marketing/AnalyzerPreview.jsx';
import FinalCTA from '../components/marketing/FinalCTA.jsx';
import FAQ from '../components/marketing/FAQ.jsx';

export default function Landing() {
  const location = useLocation();

  // Smooth-scroll to in-page sections when arriving with a hash (e.g. /#faq).
  useEffect(() => {
    const id = location.hash?.replace('#', '');
    const timer = setTimeout(() => {
      const element = id ? document.getElementById(id) : null;
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else if (!id) window.scrollTo({ top: 0 });
    }, 0);
    return () => clearTimeout(timer);
  }, [location.hash, location.pathname]);

  return (
    <div>
      <Hero />
      <ProductTour />

      {/* Trust & architectural integrity bar */}
      <section className="border-y border-line bg-surface py-10">
        <div className="container-page grid gap-8 sm:grid-cols-3">
          <div className="flex gap-3.5 items-start">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70">
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Strict Data Ownership</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Bcrypt password hashing, HTTP-only JWT cookies, and strict database ownership validation on every private endpoint.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70">
              <Gauge size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Reproducible Rubric Scoring</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Scores stem from an open 100-point rubric, not a black-box prompt. AI suggestions are clearly tagged when active.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200/70">
              <CheckCircle2 size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Zero Vendor Lock-in</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                All templates, editing, analysis, and public portfolio pages remain 100% operational even without external AI keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <TemplateShowcase />
      <AnalyzerPreview />
      <FinalCTA />
      <FAQ />

      <section className="container-page py-12">
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-slate-400">
          PortiAI is an academic project. The interfaces shown on this page use sample content, clearly marked as such.
          Zero fabricated testimonials or customer logos.
        </p>
      </section>
    </div>
  );
}
