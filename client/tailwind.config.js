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
        // Master Paper & Surface System (Deep Charcoal Emerald)
        paper: '#0B1411',
        'paper-light': '#14221C',
        'paper-dark': '#192A22',
        surface: '#14221C',
        'surface-raised': '#1A2D24',
        'surface-soft': '#0E1A15',
        
        // Master Typography Tokens (High Contrast Crisp Light Text)
        ink: '#F3F6F2',
        'ink-secondary': '#AAB8B0',
        'ink-muted': '#728078',
        muted: '#AAB8B0',
        'muted-light': '#728078',

        // Master Lines & Borders
        line: 'rgba(255, 255, 255, 0.08)',
        'line-dark': 'rgba(255, 255, 255, 0.14)',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-strong': 'rgba(255, 255, 255, 0.14)',

        // Primary Engineering Green Brand (Luminous Emerald)
        primary: '#3FA77A',
        'primary-hover': '#339167',
        'primary-soft': 'rgba(63, 167, 122, 0.15)',
        accent: '#D6A85F',
        'accent-hover': '#C2954B',
        'accent-subtle': 'rgba(214, 168, 95, 0.15)',

        // Warm Ochre Accent / Attention
        ochre: '#D6A85F',
        'ochre-soft': 'rgba(214, 168, 95, 0.15)',
        attention: '#D6A85F',
        'attention-hover': '#C2954B',
        'attention-subtle': 'rgba(214, 168, 95, 0.15)',

        // Semantic Feedback States
        success: '#4CAF7D',
        'success-hover': '#3E9B6C',
        'success-soft': 'rgba(76, 175, 125, 0.15)',
        warning: '#D6A85F',
        'warning-soft': 'rgba(214, 168, 95, 0.15)',
        danger: '#D96C6C',
        'danger-hover': '#C45757',
        'danger-soft': 'rgba(217, 108, 108, 0.15)',
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        xs: '3px',
        sm: '5px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      maxWidth: {
        'page-narrow': '960px',
        'page-default': '1200px',
        'page-wide': '1440px',
      },
      zIndex: {
        '0': '0',
        'nav': '40',
        'dropdown': '60',
        'modal-backdrop': '100',
        'modal': '110',
        'toast': '200',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.25)',
        'sm': '0 2px 6px -1px rgba(0, 0, 0, 0.40), 0 1px 4px -1px rgba(0, 0, 0, 0.25)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.35), 0 1px 3px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 6px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 8px -1px rgba(63, 167, 122, 0.12)',
        'elevated': '0 10px 30px -4px rgba(0, 0, 0, 0.6), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
        'modal': '0 24px 60px -12px rgba(0, 0, 0, 0.85), 0 12px 28px -6px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-up': 'fadeUp 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'page-enter': 'pageEnter 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'route-progress': 'routeProgress 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-subtle': 'floatSubtle 3.5s ease-in-out infinite',
        'stagger-1': 'staggerFade 0.25s 0.04s cubic-bezier(0.16, 1, 0.3, 1) both',
        'stagger-2': 'staggerFade 0.25s 0.08s cubic-bezier(0.16, 1, 0.3, 1) both',
        'stagger-3': 'staggerFade 0.25s 0.12s cubic-bezier(0.16, 1, 0.3, 1) both',
        'stagger-4': 'staggerFade 0.25s 0.16s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.996)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        routeProgress: {
          '0%': { width: '0%', opacity: '1' },
          '50%': { width: '70%', opacity: '1' },
          '85%': { width: '95%', opacity: '0.9' },
          '100%': { width: '100%', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.08)' },
        },
        floatSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        staggerFade: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
