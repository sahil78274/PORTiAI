import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function FinalCTA() {
  const { user } = useAuth();
  return (
    <section className="relative overflow-hidden border-t border-slate-800 bg-slate-950 py-16 text-white sm:py-20">
      {/* Subtle ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      >
        <div className="mx-auto h-full max-w-4xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 blur-3xl" />
      </div>

      <div className="container-page flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-indigo-300">
            <Sparkles size={11} aria-hidden="true" />
            <span>Ready in minutes</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Make Your Work Impossible to Overlook.
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
            Start with the skills and projects you already have. PortiAI handles the templates, formatting, and
            scoring so you stand out to hiring teams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={user ? '/dashboard/create' : '/register'}
            className="btn btn-lg bg-white text-slate-950 shadow-raised hover:bg-slate-100 active:bg-slate-200"
          >
            <span>Create Your Portfolio</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          {!user ? (
            <Link
              to="/login"
              className="btn btn-lg border border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              Sign In
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
