import { Link } from 'react-router-dom';

/** PortiAI brand mark: geometric P with a gradient and an AI spark. */
export default function Logo({ to = '/', size = 'md', className = '', withWordmark = true }) {
  const markSize = size === 'sm' ? 26 : size === 'lg' ? 38 : 32;

  const content = (
    <span className={`inline-flex select-none items-center gap-2.5 ${className}`}>
      <span
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-[0_10px_24px_-12px_rgba(99,102,241,0.9)]"
        style={{ width: markSize, height: markSize, background: 'linear-gradient(145deg, #101735, #070b18)' }}
        aria-hidden="true"
      >
        <span className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(99,102,241,0.65), transparent 65%)' }} />
        <svg
          width={Math.round(markSize * 0.62)}
          height={Math.round(markSize * 0.62)}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative"
        >
          <path d="M5 20V4h7.5a5.5 5.5 0 0 1 0 11H8v5H5Z" fill="url(#logo-grad)" />
          <path d="M8 7v5h4.5a2.5 2.5 0 0 0 0-5H8Z" fill="#070b18" />
          <circle cx="18" cy="6" r="2.1" fill="#a855f7" />
          <defs>
            <linearGradient id="logo-grad" x1="5" y1="4" x2="19" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="0.55" stopColor="#a5b4fc" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </svg>
      </span>

      {withWordmark ? (
        <span
          className={`font-display font-bold tracking-[-0.03em] text-ink ${
            size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-[22px]' : 'text-[18px]'
          }`}
        >
          Porti<span className="gradient-text">AI</span>
        </span>
      ) : null}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} className="rounded-lg transition-opacity hover:opacity-90">
      {content}
    </Link>
  );
}
