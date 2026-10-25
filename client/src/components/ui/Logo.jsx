import { Link } from 'react-router-dom';

export default function Logo({ to = '/', size = 'md', className = '', withWordmark = true }) {
  const markSize = size === 'sm' ? 24 : size === 'lg' ? 34 : 28;

  const content = (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <span
        className="relative flex shrink-0 items-center justify-center rounded-lg bg-slate-950 shadow-xs ring-1 ring-slate-800"
        style={{ width: markSize, height: markSize }}
        aria-hidden="true"
      >
        <svg
          width={Math.round(markSize * 0.65)}
          height={Math.round(markSize * 0.65)}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylised geometric P + spark */}
          <path
            d="M5 20V4h7.5a5.5 5.5 0 0 1 0 11H8v5H5Z"
            fill="url(#logo-grad)"
          />
          <path
            d="M8 7v5h4.5a2.5 2.5 0 0 0 0-5H8Z"
            fill="#090d16"
          />
          <circle cx="17.5" cy="17.5" r="2.2" fill="#818cf8" />
          <defs>
            <linearGradient id="logo-grad" x1="5" y1="4" x2="19" y2="15" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#a5b4fc" />
            </linearGradient>
          </defs>
        </svg>
      </span>

      {withWordmark ? (
        <span
          className={`font-semibold tracking-[-0.025em] text-ink ${
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
          }`}
        >
          Porti<span className="bg-gradient-to-r from-accent to-indigo-500 bg-clip-text text-transparent font-bold">AI</span>
        </span>
      ) : null}
    </span>
  );

  if (!to) return content;
  return (
    <Link
      to={to}
      className="rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="PortiAI home"
    >
      {content}
    </Link>
  );
}
