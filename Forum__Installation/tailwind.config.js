/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#090A0C',
          secondary: '#0D0F12',
          surface: '#111317',
        },
        card: {
          DEFAULT: '#111317',
          surface: '#15181E',
          hover: '#191C24',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          subtle: 'rgba(255, 255, 255, 0.02)',
          medium: 'rgba(255, 255, 255, 0.05)',
          strong: 'rgba(255, 255, 255, 0.08)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.09)',
          subtle: 'rgba(255, 255, 255, 0.05)',
          strong: 'rgba(255, 255, 255, 0.18)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        accent: '#3B82F6',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        button: ['Geist', 'sans-serif'],
        label: ['"Space Grotesk"', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        cambria: ['Cambria', 'Georgia', 'serif'],
      },
      animation: {
        'glow': 'glow 3s ease-in-out infinite alternate',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      }
    },
  },
  plugins: [],
}
