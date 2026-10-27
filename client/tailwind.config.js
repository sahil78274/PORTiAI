/** @type {import('tailwindcss').Config} */

/*
 * Colour tokens are CSS variables declared in `src/index.css` (`:root` = light,
 * `.dark` = dark). Keeping them as variables means one theme switch repaints the
 * whole app, including pages that know nothing about the toggle.
 *
 * Opacity modifiers (`bg-accent/20`) do not work on `var()` colours, so every
 * translucent shade has its own token instead (`accentLine`, `successSoft`, ...).
 */
const token = (name) => `var(--${name})`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        canvasAlt: token('canvas-alt'),
        canvasDeep: token('canvas-deep'),
        surface: token('surface'),
        surfaceRaised: token('surface-raised'),
        surfaceHigh: token('surface-high'),
        ink: token('ink'),
        inkSoft: token('ink-soft'),
        muted: token('muted'),
        faint: token('faint'),
        line: token('line'),
        lineStrong: token('line-strong'),
        overlay: token('overlay'),
        navy: token('navy'),
        navySoft: token('navy-soft'),
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          strong: token('accent-strong'),
          soft: token('accent-soft'),
          line: token('accent-line'),
          contrast: token('accent-contrast'),
        },
        success: token('success'),
        successSoft: token('success-soft'),
        successLine: token('success-line'),
        warning: token('warning'),
        warningSoft: token('warning-soft'),
        warningLine: token('warning-line'),
        danger: token('danger'),
        dangerSoft: token('danger-soft'),
        dangerLine: token('danger-line'),
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
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
        xs: '3px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
        '3xl': '14px',
        full: '9999px',
      },
      boxShadow: {
        /* Flat design: shadows carry almost no weight, borders do the work. */
        none: 'none',
        card: '0 1px 2px rgba(16, 24, 40, 0.04)',
        raised: '0 1px 2px rgba(16, 24, 40, 0.06), 0 4px 12px -6px rgba(16, 24, 40, 0.12)',
        float: '0 12px 32px -12px rgba(16, 24, 40, 0.22), 0 2px 6px -2px rgba(16, 24, 40, 0.08)',
        focus: '0 0 0 3px var(--accent-soft)',
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
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        fadeUp: 'fadeUp 0.2s ease-out both',
        fadeIn: 'fadeIn 0.16s ease-out both',
      },
    },
  },
  plugins: [],
};
