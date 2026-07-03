/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Larderly design tokens, ported from the web app's hardcoded hex palette.
      colors: {
        primary: {
          DEFAULT: '#E87A3D',
          dark: '#D96B2E',
        },
        canvas: '#F4F2EE',
        surface: '#FFFFFF',
        'surface-muted': '#FDFCFB',
        ink: '#2C2C2C',
        line: '#EAE8E3',
        muted: '#A09C96',
      },
      borderRadius: {
        card: '24px',
        field: '16px',
      },
      borderWidth: {
        3: '3px',
      },
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
