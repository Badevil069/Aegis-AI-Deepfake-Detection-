/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#0B0F1A',
        'app-surface': '#111827',
        'brand-cyan': '#38BDF8',
        'brand-blue': '#3B82F6',
        'brand-indigo': '#6366F1',
        'brand-violet': '#8B5CF6',
        'brand-magenta': '#EC4899',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft-glow': '0 0 24px rgba(56, 189, 248, 0.25)',
        'soft-xl': '0 20px 50px rgba(2, 6, 23, 0.6)',
        'neon-cyan': '0 0 30px rgba(56, 189, 248, 0.3), 0 0 60px rgba(56, 189, 248, 0.1)',
        'neon-indigo': '0 0 30px rgba(99, 102, 241, 0.3), 0 0 60px rgba(99, 102, 241, 0.1)',
        'neon-violet': '0 0 30px rgba(139, 92, 246, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(56, 189, 248, 0.3)' },
          '50%': { borderColor: 'rgba(139, 92, 246, 0.5)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'spin-slow': 'spinSlow 20s linear infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
