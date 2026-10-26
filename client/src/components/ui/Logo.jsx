import { Link } from 'react-router-dom';

/**
 * PortiAI wordmark: a solid navy tile with a white "P" counter, plus the name.
 * `tone="light"` is for dark surfaces (auth panel, dark footers).
 */
export default function Logo({ to = '/', size = 'md', className = '', withWordmark = true, tone = 'dark' }) {
  const markSize = size === 'sm' ? 24 : size === 'lg' ? 34 : 28;

  const content = (
    <span className={`inline-flex select-none items-center gap-2 ${className}`}>
      <span
        className={`flex shrink-0 items-center justify-center rounded-[7px] ${
          tone === 'light' ? 'bg-white text-[#16233b]' : 'bg-[#16233b] text-white'
        }`}
        style={{ width: markSize, height: markSize }}
        aria-hidden="true"
      >
        <svg width={Math.round(markSize * 0.56)} height={Math.round(markSize * 0.56)} viewBox="0 0 24 24" fill="none">
          <path d="M5 20V4h7.2a5.4 5.4 0 0 1 0 10.8H8.6V20H5Zm3.6-8.4h3.4a2.2 2.2 0 0 0 0-4.4H8.6v4.4Z" fill="currentColor" />
          <circle cx="18.4" cy="6.4" r="1.7" fill="currentColor" opacity="0.55" />
        </svg>
      </span>

      {withWordmark ? (
        <span
          className={`font-display font-semibold tracking-[-0.03em] ${
            tone === 'light' ? 'text-white' : 'text-ink'
          } ${size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[21px]' : 'text-[17px]'}`}
        >
          PortiAI
        </span>
      ) : null}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="rounded-md transition-opacity hover:opacity-80" aria-label="PortiAI home">
      {content}
    </Link>
  );
}
