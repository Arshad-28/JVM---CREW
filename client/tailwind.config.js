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
        // Master Paper & Surface System
        paper: '#F5F4EF',
        'paper-light': '#FAFAF7',
        'paper-dark': '#ECEAE2',
        surface: '#FAFAF7',
        'surface-raised': '#FFFFFF',
        'surface-soft': '#ECEAE2',
        
        // Master Typography Tokens
        ink: '#17201C',
        'ink-secondary': '#59635D',
        'ink-muted': '#7B827D',
        muted: '#59635D',
        'muted-light': '#7B827D',

        // Master Lines & Borders
        line: '#D8D6CE',
        'line-dark': '#C6C3B9',
        border: '#D8D6CE',
        'border-strong': '#C6C3B9',

        // Primary Engineering Green Brand
        primary: '#2D5A43',
        'primary-hover': '#244A37',
        'primary-soft': '#E4EEE8',
        accent: '#2D5A43',
        'accent-hover': '#244A37',
        'accent-subtle': '#E4EEE8',

        // Warm Ochre Accent / Attention
        ochre: '#C98A2E',
        'ochre-soft': '#F5E8CF',
        attention: '#B7791F',
        'attention-hover': '#9C6415',
        'attention-subtle': '#F7EEDB',

        // Semantic Feedback States
        success: '#2F7A57',
        'success-hover': '#256346',
        'success-soft': '#E5F1EA',
        warning: '#B7791F',
        'warning-soft': '#F7EEDB',
        danger: '#B94A48',
        'danger-hover': '#9E3B39',
        'danger-soft': '#F7E5E4',
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
        '2xs': '0 1px 2px 0 rgba(23, 32, 28, 0.03)',
        'xs': '0 1px 3px 0 rgba(23, 32, 28, 0.05), 0 1px 2px -1px rgba(23, 32, 28, 0.03)',
        'sm': '0 2px 6px -1px rgba(23, 32, 28, 0.06), 0 1px 4px -1px rgba(23, 32, 28, 0.04)',
        'card': '0 1px 3px 0 rgba(23, 32, 28, 0.04), 0 1px 2px -1px rgba(23, 32, 28, 0.03)',
        'card-hover': '0 4px 12px -2px rgba(23, 32, 28, 0.07), 0 2px 6px -1px rgba(23, 32, 28, 0.04)',
        'elevated': '0 8px 24px -4px rgba(23, 32, 28, 0.08), 0 3px 8px -2px rgba(23, 32, 28, 0.04)',
        'modal': '0 20px 48px -8px rgba(15, 23, 20, 0.22), 0 8px 20px -6px rgba(15, 23, 20, 0.12)',
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
