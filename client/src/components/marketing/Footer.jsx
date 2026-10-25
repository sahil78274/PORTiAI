import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';

const LINK_GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Templates', to: '/templates' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'FAQ', to: '/#faq' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/register' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Password recovery', to: '/forgot-password' },
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
    <footer className="border-t border-line bg-canvasAlt/60">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-6 text-inkSoft">
              PortiAI helps students and early-career professionals build a portfolio, review it against a documented
              rubric and publish it at a single shareable link.
            </p>
            <p className="mt-4 text-xs leading-5 text-muted">
              An academic project built for BCA final-year submission. Free-tier services are used for hosting, database
              and AI; limits apply and are documented in the project README.
            </p>
          </div>
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted">{group.title}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-inkSoft hover:text-ink hover:underline hover:underline-offset-4">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PortiAI. Built as an academic project.</p>
          <p>
            Demo content on this site is sample data, not real users or customer results.
          </p>
        </div>
      </div>
    </footer>
  );
}
