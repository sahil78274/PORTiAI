import { Link } from 'react-router-dom';

export default function Logo({ to = '/', size = 'md', className = '', withWordmark = true }) {
  const markSize = size === 'sm' ? 24 : size === 'lg' ? 32 : 28;
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={markSize} height={markSize} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <rect width="32" height="32" rx="5" fill="#2f4a8b" />
        <path d="M10.5 23.5V8.5h6.6c2.9 0 4.9 1.7 4.9 4.4 0 2.8-2 4.5-5 4.5h-3.4v6.1h-3.1Zm3.1-8.6h3.2c1.3 0 2.1-.7 2.1-1.9 0-1.2-.8-1.9-2.1-1.9h-3.2v3.8Z" fill="#fbfaf7" />
      </svg>
      {withWordmark ? (
        <span className={`font-semibold tracking-[-0.015em] text-ink ${size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-xl' : 'text-[17px]'}`}>
          Porti<span className="text-accent">AI</span>
        </span>
      ) : null}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="rounded-sm focus-visible:ring-2" aria-label="PortiAI home">
      {content}
    </Link>
  );
}
