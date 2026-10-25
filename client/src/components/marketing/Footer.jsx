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
    title: 'Workspace',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/register' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Account recovery', to: '/forgot-password' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-3.5 max-w-xs text-xs leading-relaxed text-slate-600">
              PortiAI helps students and early-career developers build, review, and publish high-quality portfolios with
              rule-based scoring and Gemini AI assistance.
            </p>
            <p className="mt-4 text-2xs leading-relaxed text-slate-400">
              BCA final-year academic project. Built with React 19, Tailwind CSS, Express, and MongoDB. Zero paid services required.
            </p>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-2xs font-semibold uppercase tracking-[0.16em] text-slate-400">{group.title}</h2>
              <ul className="mt-3.5 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs font-medium text-slate-600 transition-colors hover:text-ink hover:underline hover:underline-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-2xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PortiAI. All portfolio content belongs to its respective creators.</p>
          <p>
            Demo previews show sample data to accurately illustrate layout behavior.
          </p>
        </div>
      </div>
    </footer>
  );
}
