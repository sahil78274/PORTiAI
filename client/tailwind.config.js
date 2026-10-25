/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#fbfaf7',
        canvasAlt: '#f4f2ed',
        surface: '#ffffff',
        ink: '#1b1c1e',
        inkSoft: '#4a4d52',
        muted: '#6f7278',
        faint: '#8f9298',
        line: '#e6e3dc',
        lineStrong: '#d5d1c8',
        accent: {
          DEFAULT: '#2f4a8b',
          hover: '#273d74',
          soft: '#eef1f8',
          line: '#c9d3e8',
        },
        success: '#1f6b4a',
        successSoft: '#edf5f0',
        warning: '#8a5a10',
        warningSoft: '#fbf3e4',
        danger: '#a3342e',
        dangerSoft: '#fbeeed',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Iowan Old Style', 'Palatino Linotype', 'Palatino', 'Georgia', 'Cambria', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
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
        '4xl': ['38px', { lineHeight: '44px' }],
        '5xl': ['46px', { lineHeight: '52px' }],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '5px',
        lg: '7px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27, 28, 30, 0.04), 0 1px 3px rgba(27, 28, 30, 0.05)',
        raised: '0 4px 12px rgba(27, 28, 30, 0.07), 0 1px 3px rgba(27, 28, 30, 0.05)',
        focus: '0 0 0 3px rgba(47, 74, 139, 0.18)',
      },
      maxWidth: {
        content: '1120px',
        prose2: '68ch',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
};
