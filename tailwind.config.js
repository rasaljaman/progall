/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background:       "rgb(var(--background) / <alpha-value>)",
        surface:          "rgb(var(--surface) / <alpha-value>)",
        surfaceHighlight: "rgb(var(--surface-highlight) / <alpha-value>)",
        textPrimary:      "rgb(var(--text-primary) / <alpha-value>)",
        textSecondary:    "rgb(var(--text-secondary) / <alpha-value>)",
        accent:           "rgb(var(--accent) / <alpha-value>)",
        accentEnd:        "rgb(var(--accent-end) / <alpha-value>)",
        border:           "rgb(var(--border) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backdropBlur: {
        'xs': '4px',
        'xl': '20px',
        '2xl': '40px',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'accent': '0 0 40px -10px rgb(var(--accent) / 0.4)',
        'glow': '0 0 60px -15px rgb(var(--accent) / 0.3)',
      }
    },
  },
  plugins: [],
}
