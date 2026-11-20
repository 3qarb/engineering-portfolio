/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#09090a',
          900: '#0f0f10',
          850: '#141415',
          800: '#1a1a1b',
          700: '#242425',
          600: '#333334',
        },
        bone: {
          DEFAULT: '#ece7df',
          dim: '#b9b3aa',
          mute: '#958f86', // 6.2:1 on ink-950
          faint: '#807a72', // 4.7:1 on ink-950 — smallest text allowed
        },
        sand: {
          DEFAULT: '#c9a46c',
          light: '#e2c79c',
          deep: '#9c7a46',
        },
        rust: '#c0603f',
      },
      fontFamily: {
        display: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        arabic: ['"IBM Plex Sans Arabic"', '"Inter Tight"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.14em',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      // one tight radius scale: drawing-sheet corners, not app cards
      borderRadius: {
        sm: '2px',
        DEFAULT: '2px',
        md: '3px',
        lg: '3px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '4px',
      },
      maxWidth: {
        site: '1440px',
      },
    },
  },
  plugins: [],
};
