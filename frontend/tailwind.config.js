/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060A12',
          900: '#0A0F1E',
          800: '#111827',
          700: '#1A2336',
          600: '#243048',
        },
        electric: {
          600: '#D97706',
          500: '#F59E0B',
          400: '#FBBF24',
          300: '#FCD34D',
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", 'system-ui', 'sans-serif'],
        mono: ["'DM Mono'", 'monospace'],
        display: ["'Bebas Neue'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
