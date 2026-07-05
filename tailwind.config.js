/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E87A3D',
          dark: '#F08C52',
          glow: 'rgba(232,122,61,0.20)',
        },
        canvas: { DEFAULT: '#F4F2EE', dark: '#0F0F13' },
        surface: { DEFAULT: '#FFFFFF', dark: '#1A1A22' },
        'surface-muted': { DEFAULT: '#FDFCFB', dark: '#14141C' },
        ink: { DEFAULT: '#2C2C2C', dark: '#F0EEE9' },
        line: { DEFAULT: '#EAE8E3', dark: '#2A2A35' },
        muted: { DEFAULT: '#A09C96', dark: '#6B6878' },
        subtle: '#B0ADA8',
        success: '#3B9E6E',
        warning: '#E0A63B',
        danger: '#D9524A',
        info: '#3B82F6',
      },
      borderRadius: { card: '24px', field: '16px' },
      borderWidth: { 3: '3px' },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
      },
    },
  },
  plugins: [],
};
