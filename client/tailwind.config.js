/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#EFEDE7',
        'paper-light': '#F7F6F3',
        'paper-dark': '#E5E2DA',
        ink: '#22241F',
        'ink-light': '#383B33',
        line: '#C9C6BC',
        'line-dark': '#AFAAA0',
        accent: '#35604A', // Moss green (progress, primary actions)
        'accent-hover': '#2B4E3C',
        'accent-subtle': '#E8EFEA',
        attention: '#A8631A', // Ochre (blockers, overdue)
        'attention-subtle': '#FAF1E6',
        muted: '#6B6A61',
        'muted-light': '#8F8E84',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '4px',
      },
    },
  },
  plugins: [],
}
