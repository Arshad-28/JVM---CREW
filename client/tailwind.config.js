/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '420px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
      '3xl': '1600px',
    },
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
        lg: '6px',
        xl: '8px',
      },
      maxWidth: {
        'page-narrow': '56rem',   // 896px  (4xl)
        'page-default': '80rem',  // 1280px (7xl)
        'page-wide': '90rem',     // 1440px
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
