import { Link, Outlet } from 'react-router-dom';
import { Check, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

const POINTS = [
  {
    title: 'Structured 7-step builder',
    desc: 'Guided fields for projects, experience, skills, and recruiter details.',
  },
  {
    title: 'AI wording assistance',
    desc: 'Generate summaries or improve descriptions with Gemini free tier.',
  },
  {
    title: 'Custom public URL',
    desc: 'Publish instantly to your unique slug with one-click toggling.',
  },
];

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-canvas to-canvasAlt/40">
      <header className="border-b border-line bg-white/70 backdrop-blur-sm">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="text-xs font-semibold text-slate-600 transition-colors hover:text-ink focus-visible:outline-none"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main id="main" className="flex flex-1 items-center py-12 sm:py-16">
        <div className="container-page grid w-full gap-12 lg:grid-cols-[1.1fr_440px] lg:items-center">
          <div className="hidden lg:block space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-indigo-700">
              <Sparkles size={11} aria-hidden="true" />
              <span>Free Academic Platform</span>
            </div>

            <h1 className="max-w-lg text-3xl font-bold tracking-tight text-ink sm:text-4xl leading-tight">
              A portfolio that highlights real work, not buzzwords.
            </h1>

            <p className="max-w-md text-base leading-relaxed text-inkSoft">
              Build your technical portfolio in minutes with clean layouts, objective 100-point rubric reviews, and
              instant public links.
            </p>

            <ul className="space-y-4 pt-2">
              {POINTS.map((point) => (
                <li key={point.title} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
                    <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="block text-sm font-semibold text-ink">{point.title}</span>
                    <span className="block text-xs leading-relaxed text-muted">{point.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-line text-2xs leading-relaxed text-slate-400 max-w-sm">
              PortiAI is an open academic final-year project. Real MongoDB persistence, zero trackers, and complete privacy.
            </div>
          </div>

          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
