/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './store/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      colors: {
        ink: '#111111',
        canvas: '#ffffff',
        'soft-cloud': '#f5f5f5',
        hairline: '#cacacb',
        'hairline-soft': '#e5e5e5',
        charcoal: '#39393b',
        ash: '#4b4b4d',
        mute: '#707072',
        stone: '#9e9ea0',
        sale: '#d30005',
        'sale-deep': '#780700',
        success: '#007d48',
        info: '#1151ff',
      },
      fontFamily: {
        display: ['Bebas Neue', 'Futura', 'sans-serif'],
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      spacing: {
        section: '48px',
      },

      keyframes: {
        toastIn: {
          '0%': { transform: 'translateX(120%) scale(0.9)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        toastOut: {
          '0%': { transform: 'translateX(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateX(120%) scale(0.9)', opacity: '0' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.35)' },
          '50%': { transform: 'scale(0.95)' },
          '75%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        cartBounce: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.4) rotate(-10deg)' },
          '60%': { transform: 'scale(1.2) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'toast-in': 'toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-out': 'toastOut 0.25s ease-in forwards',
        heartbeat: 'heartbeat 0.45s ease-in-out',
        'cart-bounce': 'cartBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
