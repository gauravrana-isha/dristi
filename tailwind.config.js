/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#613AF5',
          50: '#F3EFFE',
          100: '#E0D5FD',
          200: '#C1ABFB',
          300: '#A281F9',
          400: '#8357F7',
          500: '#613AF5',
          600: '#4A2BC2',
          700: '#392095',
          800: '#281668',
          900: '#170C3B',
        },
        danger: {
          DEFAULT: '#B7131A',
          500: '#B7131A',
        },
        warning: {
          DEFAULT: '#B77224',
          500: '#B77224',
        },
        success: {
          DEFAULT: '#3C9718',
          500: '#3C9718',
        },
        info: {
          DEFAULT: '#00AAFF',
          500: '#00AAFF',
        },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};
