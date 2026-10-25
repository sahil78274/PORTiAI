import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function FinalCTA() {
  const { user } = useAuth();
  return (
    <section className="border-t border-line bg-ink py-14 text-white sm:py-16">
      <div className="container-page flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="max-w-xl">
          <h2 className="text-2xl text-white sm:text-3xl">Make Your Work Impossible to Overlook.</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Start with the information you already have. PortiAI handles the structure, the templates and the review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={user ? '/dashboard/create' : '/register'}
            className="btn bg-white px-4 py-2 text-base font-medium text-ink hover:bg-white/90"
          >
            Create Your Portfolio
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          {!user ? (
            <Link to="/login" className="btn px-4 py-2 text-base text-white/80 hover:bg-white/10 hover:text-white">
              I already have an account
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
