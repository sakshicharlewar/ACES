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
          DEFAULT: '#0B0B0B',
          secondary: '#111111',
        },
        card: '#171717',
        glass: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.08)',
        text: {
          primary: '#FFFFFF',
          secondary: '#B5B5B5',
        },
        accent: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
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
