/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Disable automatic OS dark mode
  theme: {
    extend: {
      colors: {
        violet: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c2c2ff',
          300: '#9494ff',
          400: '#5a5aff',
          500: '#14137F', // Brand Primary #14137F
          600: '#0000d6', // Darker shade
          700: '#0000ac',
          800: '#00008b',
          900: '#000070',
          950: '#000045',
        },
        blue: {
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c2c2ff',
          300: '#9494ff',
          400: '#5a5aff',
          500: '#14137F', // Brand Primary #14137F
          600: '#14137F', // Enforcing Brand Primary on 600 as well for components using it
          700: '#0e0e5e',
          800: '#00008b',
          900: '#000070',
          950: '#000045',
        },
        sidebar: {
          DEFAULT: '#FFFFFF', // White background
          hover: '#F3F4F6',   // Light gray hover (gray-100)
          active: '#14137F',  // Brand Primary for active background
          border: '#E5E7EB',  // Light border (gray-200)
          text: '#111827',    // Dark text (gray-900)
        },
        primary: {
          DEFAULT: '#14137F',
          50: '#f0f0ff',
          100: '#e0e0ff',
          200: '#c2c2ff',
          300: '#9494ff',
          400: '#5a5aff',
          500: '#14137F',
          600: '#0000d6',
          700: '#0000ac',
          800: '#00008b',
          900: '#000070',
          950: '#000045',
        }
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
