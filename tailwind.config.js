/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'monad-purple': '#836EF9',
        'monad-dark': '#202124',
        'monad-neon': '#A0055D',
      },
      boxShadow: {
        'neon-soft': '0 0 25px rgba(131, 110, 249, 0.6)',
      },
      dropShadow: {
        'neon-text': '0 0 12px rgba(131, 110, 249, 0.9)',
      },
      fontFamily: {
        sans: ['system-ui', 'SF Pro Text', 'ui-sans-serif', 'sans-serif'],
      },
      keyframes: {
        'radar-ping': {
          '0%': { transform: 'scale(0.6)', opacity: '0.8' },
          '70%': { transform: 'scale(1.3)', opacity: '0.15' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'avatar-pulse': {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 18px rgba(131, 110, 249, 0.9)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 26px rgba(160, 5, 93, 0.9)' },
        },
      },
      animation: {
        'radar-ping': 'radar-ping 2.4s ease-out infinite',
        'avatar-pulse': 'avatar-pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};


