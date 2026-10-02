/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        surface: {
          DEFAULT: '#12141d',
          hover: '#191c28',
          border: '#232738',
        },
        brand: {
          accent: '#6366f1', // Indigo evidence highlight
          fact: '#10b981',   // Emerald green for verified facts
          assumption: '#f59e0b', // Amber yellow for subjective assumptions
          uncertainty: '#8b5cf6', // Violet purple for open uncertainties
          danger: '#f43f5e', // Rose red for missing evidence
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
