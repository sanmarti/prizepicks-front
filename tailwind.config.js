/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0d12',
        'bg-surface': '#111520',
        'bg-surface2': '#181e2e',
        'accent-purple': '#7c6ef5',
        'accent-green': '#39e07b',
        'epl': '#3a7d44',
        'champions': '#1a3a6b',
        'laliga': '#8b1a1a',
        'seriea': '#0055a4',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
