/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#121212',
        'dark-surface': '#1B1B1B',
        'kelly-green': '#4CBB17',
        'slate-glass': 'rgba(71, 85, 105, 0.2)',
      },
      fontFamily: {
        sports: ['Bebas Neue', 'sans-serif'],
        data: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
