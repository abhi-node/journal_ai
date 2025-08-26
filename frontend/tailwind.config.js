/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        pastel: {
          lavender: {
            50: '#FAF8FE',
            100: '#F3EFFD',
            200: '#E8DFFC',
            300: '#DAC7FA',
            400: '#C7A4F7',
            500: '#B483F0',
            600: '#9F5FE5',
            700: '#8642D6',
            800: '#6F36B3',
            900: '#5A2E91',
          },
          mint: {
            50: '#F0FDF9',
            100: '#D2FCE9',
            200: '#A8F5D4',
            300: '#6FE9B5',
            400: '#36D592',
            500: '#13BC71',
            600: '#0D9B5B',
            700: '#0E7A4A',
            800: '#10603D',
            900: '#104F34',
          },
          peach: {
            50: '#FFF5F0',
            100: '#FFE8DB',
            200: '#FFD4BD',
            300: '#FFB894',
            400: '#FF9668',
            500: '#FF7849',
            600: '#FF5A2E',
            700: '#E64322',
            800: '#C03621',
            900: '#9C2F20',
          },
          sky: {
            50: '#F0F9FF',
            100: '#E0F3FF',
            200: '#B9E6FF',
            300: '#7CD4FF',
            400: '#36BDFF',
            500: '#0AA3FF',
            600: '#0082E6',
            700: '#0065BA',
            800: '#005199',
            900: '#00447E',
          },
          rose: {
            50: '#FFF0F5',
            100: '#FFE3EC',
            200: '#FFCBDB',
            300: '#FFA1BD',
            400: '#FF6698',
            500: '#FF3578',
            600: '#EE1158',
            700: '#C90843',
            800: '#A7093A',
            900: '#8D0B34',
          },
          cream: {
            50: '#FDFBF7',
            100: '#FBF5EC',
            200: '#F5E8D6',
            300: '#EDD6B3',
            400: '#E3C08C',
            500: '#D6A56B',
            600: '#C58852',
            700: '#A86C43',
            800: '#89563A',
            900: '#714732',
          },
        },
        neutral: {
          soft: '#F8F7FA',
          light: '#E9E5F0',
          mid: '#C5BFD3',
          deep: '#8B7FA6',
          dark: '#4A4361',
        },
      },
      fontFamily: {
        'poppins': ['Poppins-Regular', 'system-ui', '-apple-system', 'BlinkMacSystemFont'],
        'poppins-medium': ['Poppins-Medium', 'system-ui', '-apple-system'],
        'poppins-semibold': ['Poppins-SemiBold', 'system-ui', '-apple-system'],
        'poppins-bold': ['Poppins-Bold', 'system-ui', '-apple-system'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient': 'gradient 8s ease infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-4px)' },
          '75%': { transform: 'translateY(4px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}