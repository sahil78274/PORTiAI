/** @type {import('tailwindcss').Config} */

/* Colours are driven by CSS variables declared in src/index.css (:root), so
   the whole product palette lives in one place. Channels are stored as
   "R G B" triplets which keeps Tailwind opacity modifiers (bg-accent/40,
   border-danger/30 …) working.

   Portfolio templates (src/templates) set their own colours and never use
   these tokens, so changing the product palette never alters a published
   portfolio. For the same reason the existing radius scale keys
   (DEFAULT / sm / md / lg) and the default `shadow` are left as they were —
   templates use them. The product chrome uses the neumorphic tokens below. */
const channel = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: channel('--c-canvas'),
        canvasAlt: channel('--c-canvas-alt'),
        canvasDeep: channel('--c-canvas-deep'),
        surface: channel('--c-surface'),
        surfaceRaised: channel('--c-surface-raised'),
        surfaceHigh: channel('--c-surface-high'),
        ink: channel('--c-ink'),
        inkSoft: channel('--c-ink-soft'),
        muted: channel('--c-muted'),
        faint: channel('--c-faint'),
        line: channel('--c-line'),
        lineStrong: channel('--c-line-strong'),
        navy: channel('--c-ink'),
        navySoft: channel('--c-ink-soft'),
        accent: {
          DEFAULT: channel('--c-accent'),
          hover: channel('--c-accent-hover'),
          secondary: channel('--c-accent-secondary'),
          soft: 'rgb(var(--c-accent) / 0.10)',
          line: 'rgb(var(--c-accent) / 0.32)',
        },
        brand: {
          blue: channel('--c-accent'),
          indigo: channel('--c-accent-hover'),
          violet: channel('--c-accent-secondary'),
          cyan: channel('--c-accent-secondary'),
        },
        success: channel('--c-success'),
        successSoft: 'rgb(var(--c-success) / 0.10)',
        warning: channel('--c-warning'),
        warningSoft: 'rgb(var(--c-warning) / 0.10)',
        danger: channel('--c-danger'),
        dangerSoft: 'rgb(var(--c-danger) / 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Iowan Old Style"', '"Palatino Linotype"', 'Palatino', 'Georgia', 'Cambria', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px' }],
        xs: ['12px', { lineHeight: '18px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '26px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
        '4xl': ['36px', { lineHeight: '42px' }],
        '5xl': ['44px', { lineHeight: '50px' }],
        '6xl': ['54px', { lineHeight: '60px' }],
        '7xl': ['64px', { lineHeight: '70px' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
        '3xl': '22px',
        full: '9999px',
        /* Neumorphic product radii */
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        tile: 'var(--radius-tile)',
      },
      boxShadow: {
        /* Neumorphic depth — composed in index.css from --shadow-light / --shadow-dark. */
        'neu-xs': 'var(--neu-xs)',
        'neu-sm': 'var(--neu-sm)',
        neu: 'var(--neu)',
        'neu-lg': 'var(--neu-lg)',
        'neu-inset-xs': 'var(--neu-inset-xs)',
        'neu-inset-sm': 'var(--neu-inset-sm)',
        'neu-inset': 'var(--neu-inset)',
        'neu-accent': 'var(--neu-accent)',
        'neu-pressed': 'var(--neu-pressed)',
        /* Legacy names, remapped so existing usages adopt the soft system. */
        '2xs': 'var(--neu-xs)',
        xs: 'var(--neu-xs)',
        card: 'var(--neu-sm)',
        raised: 'var(--neu)',
        float: 'var(--neu-lg)',
        glow: '0 0 0 1px rgb(var(--c-accent) / 0.22)',
        glowStrong: '0 0 0 1px rgb(var(--c-accent) / 0.38)',
        focus: '0 0 0 3px rgb(var(--c-accent) / 0.28)',
        ring: 'inset 0 0 0 1px rgb(var(--c-accent) / 0.45)',
      },
      maxWidth: {
        content: '1120px',
        wide: '1200px',
        prose2: '68ch',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.2, 0.7, 0.3, 1)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-secondary)))',
        'brand-gradient-soft': 'linear-gradient(rgb(var(--c-accent) / 0.10), rgb(var(--c-accent) / 0.10))',
        'grid-fade': 'linear-gradient(rgb(var(--c-canvas)), rgb(var(--c-canvas)))',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        fadeUp: 'fadeUp 0.28s ease-out both',
        fadeIn: 'fadeIn 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
