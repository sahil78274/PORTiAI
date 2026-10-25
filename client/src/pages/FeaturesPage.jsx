import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Features from '../components/marketing/Features.jsx';
import AnalyzerPreview from '../components/marketing/AnalyzerPreview.jsx';
import HowItWorks from '../components/marketing/HowItWorks.jsx';

const LIMITS = [
  {
    title: 'AI quota',
    body: 'Gemini free-tier limits apply per Google Cloud project and change over time. The app enforces its own per-user daily cap (default 200 AI requests) and shows the remaining allowance. When the quota is exhausted you get a clear message and can still use every non-AI feature.',
  },
  {
    title: 'Hosting',
    body: 'Free Node hosting plans may sleep after inactivity, so the first request after a quiet period can take a few seconds. The frontend is a static build and loads quickly.',
  },
  {
    title: 'Storage',
    body: 'The MongoDB Atlas free tier is sized for coursework and demonstration. There is no sharding, backup schedule or SLA on the free plan.',
  },
];

export default function FeaturesPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="container-page py-12 sm:py-14">
          <p className="eyebrow">Features</p>
          <h1 className="mt-2 max-w-2xl text-3xl sm:text-4xl">What PortiAI actually does</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-inkSoft">
            A short, honest description of every capability in this build, including what depends on the Gemini API and
            what works without it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">
              Build my portfolio <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link to="/templates" className="btn-secondary">
              Explore templates
            </Link>
          </div>
        </div>
      </section>

      <Features />
      <AnalyzerPreview />
      <HowItWorks />

      <section className="border-t border-line py-14">
        <div className="container-page">
          <h2 className="text-xl">Known limits of this free-tier deployment</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {LIMITS.map((limit) => (
              <div key={limit.title} className="card p-4">
                <h3 className="text-sm font-semibold text-ink">{limit.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{limit.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
