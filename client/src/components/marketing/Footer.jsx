import { Link } from 'react-router-dom';
import { ArrowUpRight, Code2, Mail } from 'lucide-react';
import Logo from '../ui/Logo.jsx';

const GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'Templates', to: '/templates' },
      { label: 'AI builder', to: '/dashboard/builder' },
      { label: 'Portfolio analyser', to: '/dashboard/analyzer' },
    ],
  },
  {
    title: 'Workspace',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'My portfolios', to: '/dashboard/portfolios' },
      { label: 'Blog studio', to: '/dashboard/blog' },
      { label: 'Settings', to: '/dashboard/settings' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Create an account', to: '/register' },
      { label: 'Sign in', to: '/login' },
      { label: 'Forgot password', to: '/forgot-password' },
      { label: 'Pricing', to: '/#pricing' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
      { label: 'FAQ', to: '/#faq' },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="footer" className="relative border-t border-white/[0.07] bg-[#050813]">
      <div className="container-wide py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo size="lg" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              PortiAI turns your projects, skills and experience into a polished portfolio — with AI drafting, nine design
              templates, an honest analyser and one-link publishing.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href="https://github.com/sahil78274/PORTiAI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent-line hover:text-white"
              >
                <Code2 size={13} aria-hidden="true" />
                Project source
                <ArrowUpRight size={11} aria-hidden="true" />
              </a>
              <p className="inline-flex items-center gap-2 text-[11px] text-faint">
                <Mail size={11} aria-hidden="true" />
                Email &amp; password accounts only — no social login yet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">{group.title}</p>
                <ul className="mt-3.5 space-y-2.5">
                  {group.links.map((link) =>
                    link.to.startsWith('/#') ? (
                      <li key={link.label}>
                        <a href={link.to} className="text-sm text-muted transition-colors hover:text-ink">
                          {link.label}
                        </a>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <Link to={link.to} className="text-sm text-muted transition-colors hover:text-ink">
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

        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-faint">© {new Date().getFullYear()} PortiAI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-faint">
            <Link to="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <Link to="/register" className="inline-flex items-center gap-1 text-muted transition-colors hover:text-ink">
              Start free
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
