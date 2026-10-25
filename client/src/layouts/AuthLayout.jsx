import { Link, Outlet } from 'react-router-dom';
import { Check } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

const POINTS = [
  'Build a portfolio from a seven-step wizard.',
  'Improve the wording with AI, or write it yourself.',
  'Publish to a public link you control.',
];

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo />
          <Link to="/" className="text-sm text-inkSoft hover:text-ink">
            ← Back to home
          </Link>
        </div>
      </header>

      <main id="main" className="flex flex-1 items-center py-10">
        <div className="container-page grid w-full gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="hidden lg:block">
            <h1 className="max-w-md text-2xl leading-tight tracking-[-0.01em]">
              A portfolio that shows the work, not just the adjectives.
            </h1>
            <ul className="mt-5 space-y-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-inkSoft">
                  <Check size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-sm border-t border-line pt-4 text-xs leading-5 text-muted">
              PortiAI is a BCA academic project. It runs on free-tier hosting and AI quotas apply; features degrade
              gracefully rather than breaking.
            </p>
          </div>

          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
