import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { TEMPLATE_COUNT, PREMIUM_TEMPLATE_COUNT } from '../../data/templateCatalogue.js';
import { TEMPLATE_STYLES } from '../../data/templateStyles.js';

const COLUMNS = [
  {
    title: 'Browse',
    links: [
      { label: 'Template gallery', to: '/templates' },
      { label: 'Premium catalogue', to: '/premium' },
      { label: 'Free templates', to: '/templates?access=free' },
      { label: 'Dark templates', to: '/templates?appearance=dark' },
    ],
  },
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'My portfolios', to: '/dashboard/portfolios' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Create an account', to: '/signup' },
      { label: 'Login', to: '/login' },
      { label: 'Forgot password', to: '/forgot-password' },
      { label: 'Settings', to: '/dashboard/settings' },
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
    <footer id="footer" className="border-t border-line bg-surface">
      <div className="container-wide py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo size="md" />
            <p className="mt-3 max-w-sm text-[13.5px] leading-6 text-muted">
              A portfolio platform for developers, designers, students and freelancers. {TEMPLATE_COUNT} templates, a
              live editor, an honest review, and a public link you control.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5" aria-label="Available colour themes">
              {['Light', 'Dark'].map((theme) => (
                <span key={theme} className="rounded border border-line bg-canvas px-2 py-1 text-[11px] text-muted">
                  {theme}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink">{column.title}</p>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} className="text-[13px] text-muted transition-colors hover:text-ink">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-faint">
            © {new Date().getFullYear()} PortiAI · {TEMPLATE_COUNT} templates, {PREMIUM_TEMPLATE_COUNT} premium ·{' '}
            {TEMPLATE_STYLES.length} visual styles
          </p>
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
