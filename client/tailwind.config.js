/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Paper-white canvas, charcoal type, one muted blue accent.
           Names are kept from earlier versions so semantic classes stay valid. */
        canvas: '#f7f7f5',
        canvasAlt: '#efefea',
        canvasDeep: '#ffffff',
        surface: '#ffffff',
        surfaceRaised: '#fbfbf9',
        surfaceHigh: '#f2f2ed',
        ink: '#1a1d21',
        inkSoft: '#3c434b',
        muted: '#5f6873',
        faint: '#8a9199',
        line: '#e4e4dc',
        lineStrong: '#d2d2c9',
        navy: '#16233b',
        navySoft: '#22334f',
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          soft: 'rgba(37, 99, 235, 0.08)',
          line: 'rgba(37, 99, 235, 0.28)',
        },
        brand: {
          blue: '#2563eb',
          indigo: '#3f5bd6',
          violet: '#6d5bd0',
          cyan: '#0e7490',
        },
        success: '#15803d',
        successSoft: 'rgba(21, 128, 61, 0.09)',
        warning: '#b45309',
        warningSoft: 'rgba(180, 83, 9, 0.09)',
        danger: '#b91c1c',
        dangerSoft: 'rgba(185, 28, 28, 0.08)',
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
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        '2xs': '0 1px 1px rgba(26, 29, 33, 0.04)',
        xs: '0 1px 2px rgba(26, 29, 33, 0.06)',
        card: '0 1px 2px rgba(26, 29, 33, 0.04), 0 1px 3px rgba(26, 29, 33, 0.03)',
        raised: '0 2px 4px rgba(26, 29, 33, 0.05), 0 12px 28px -18px rgba(26, 29, 33, 0.35)',
        float: '0 18px 44px -24px rgba(26, 29, 33, 0.4)',
        glow: '0 1px 2px rgba(26, 29, 33, 0.06)',
        glowStrong: '0 2px 6px rgba(26, 29, 33, 0.08)',
        focus: '0 0 0 3px rgba(37, 99, 235, 0.18)',
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
        /* Kept as solid colours so legacy class names never render a gradient. */
        'brand-gradient': 'linear-gradient(#2563eb, #2563eb)',
        'brand-gradient-soft': 'linear-gradient(rgba(37,99,235,0.06), rgba(37,99,235,0.06))',
        'grid-fade': 'linear-gradient(#f7f7f5, #f7f7f5)',
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
