/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#0B0F1A',
        'brand-cyan': '#38BDF8',
        'brand-blue': '#3B82F6',
        'brand-indigo': '#6366F1',
        'brand-violet': '#8B5CF6',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'soft-glow': '0 0 24px rgba(56, 189, 248, 0.25)',
        'soft-xl': '0 20px 45px rgba(2, 6, 23, 0.55)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.45 },
          '50%': { opacity: 0.9 },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
