import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Gauge } from 'lucide-react';
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

      <section className="border-y border-line bg-surface py-8">
        <div className="container-page grid gap-6 sm:grid-cols-3">
          <div className="flex gap-3">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">Your account, your data</p>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                Passwords are hashed with bcrypt, sessions use HTTP-only cookies, and every portfolio request is checked
                against its owner on the server.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Gauge size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">Feedback with visible reasoning</p>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                Scores come from a published rubric, not an opaque model. AI observations are labelled separately.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ArrowRight size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">Works without AI</p>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                Editing, preview, analysis and publishing keep working when the Gemini free tier is exhausted.
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

      <section className="container-page py-10">
        <p className="mx-auto max-w-3xl text-center text-xs leading-6 text-muted">
          PortiAI is an academic project. The interfaces shown on this page use sample content, clearly marked as such.
          No customer logos, testimonials or usage statistics are presented because there are no real customers to
          report on.
        </p>
      </section>
    </div>
  );
}
