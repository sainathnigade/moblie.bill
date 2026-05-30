/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        darkSurface: '#111827',
        darkSurface2: '#1f2937',
        darkBorder: '#334155',
        primary: '#2563eb',
        primaryGlow: 'rgba(37, 99, 235, 0.30)',
        accent: '#ec4899',
        accentGlow: 'rgba(236, 72, 153, 0.25)',
        info: '#38bdf8',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif']
      }
    },
  },
  plugins: [],
}
