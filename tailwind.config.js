/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#161a23',
        surface: '#0f1218',
        border: '#232836',
        accent: '#4f8cff',
        accent2: '#22c55e',
        warn: '#f59e0b',
        danger: '#ef4444',
      },
    },
  },
  plugins: [],
}
