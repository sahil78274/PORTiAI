import { Link } from 'react-router-dom';

/**
 * PortiAI wordmark — purely typographic.
 *
 * There is no icon tile or monogram badge: "Porti" carries the ink colour and
 * "AI" the single accent. `withWordmark={false}` renders the compact "P" used
 * by the collapsed dashboard sidebar.
 */
export default function Logo({ to = '/', size = 'md', className = '', withWordmark = true }) {
  const textSize = size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[22px]' : 'text-[18px]';

  const content = (
    <span className={`inline-flex select-none items-center ${className}`}>
      <span className={`font-display ${textSize} font-semibold leading-none tracking-[-0.035em] text-ink`}>
        {withWordmark ? (
          <>
            Porti<span className="text-accent-hover">AI</span>
          </>
        ) : (
          <span aria-hidden="true">P</span>
        )}
      </span>
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="rounded-sm transition-opacity hover:opacity-80" aria-label="PortiAI home">
      {content}
    </Link>
  );
}
