import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Logo from '../ui/Logo.jsx';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Templates', to: '/templates' },
      { label: 'How it works', to: '/#how-it-works' },
    ],
  },
  {
    title: 'Workspace',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'My portfolios', to: '/dashboard/portfolios' },
      { label: 'Blog', to: '/dashboard/blog' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Create an account', to: '/signup' },
      { label: 'Login', to: '/login' },
      { label: 'Forgot password', to: '/forgot-password' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="footer" className="px-3 pb-3 sm:px-4">
      <div className="container-wide rounded-[28px] bg-canvas py-12 shadow-neu-inset">
        <div className="grid gap-10 md:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo size="md" />
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
              A portfolio builder for developers, designers, students and freelancers. Start from a template, edit your
              details, publish when you are ready.
            </p>
            <Link
              to="/features"
              className="mt-4 inline-flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-ink"
            >
              <Mail size={14} aria-hidden="true" />
              What PortiAI does
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink">{column.title}</p>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) =>
                    link.to.startsWith('/#') ? (
                      <li key={link.label}>
                        <a href={link.to} className="text-[13px] text-muted transition-colors hover:text-ink">
                          {link.label}
                        </a>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <Link to={link.to} className="text-[13px] text-muted transition-colors hover:text-ink">
                          {link.label}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-faint">© {new Date().getFullYear()} PortiAI. All rights reserved.</p>
          <div className="flex items-center gap-5 text-[12px] text-faint">
            <Link to="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <Link to="/features" className="transition-colors hover:text-ink">
              Features
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
