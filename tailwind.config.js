/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#eff8ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#3b82f6',
          500: '#0064E0', // Brand Primary
          600: '#0050b3',
          700: '#003d82',
          800: '#002952',
          900: '#001529',
          950: '#000a14',
        },
        blue: {
          50: '#eff8ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#3b82f6',
          500: '#0064E0',
          600: '#0050b3',
          700: '#003d82',
          800: '#002952',
          900: '#001529',
          950: '#000a14',
        },
        sidebar: {
          DEFAULT: '#0c1324',
          hover: '#1a2236',
          active: '#242d44',
          border: '#1e2538'
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
