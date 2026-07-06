/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EA7A3C',
          dark: '#F28A4B',
          glow: 'rgba(242,138,75,0.28)',
        },
        canvas: { DEFAULT: '#F5F2EC', dark: '#090A0D' },
        'canvas-raised': { DEFAULT: '#FBF8F2', dark: '#101217' },
        surface: { DEFAULT: '#FFFDF8', dark: '#171A21' },
        'surface-muted': { DEFAULT: '#ECE7DD', dark: '#20242D' },
        'surface-elevated': { DEFAULT: '#FFFFFF', dark: '#222733' },
        ink: { DEFAULT: '#27231F', dark: '#F6F1EA' },
        'ink-soft': { DEFAULT: '#4A443D', dark: '#D7D0C7' },
        line: { DEFAULT: '#E2DACE', dark: '#303541' },
        muted: { DEFAULT: '#7D766E', dark: '#9A948D' },
        subtle: { DEFAULT: '#6F6860', dark: '#B9B1A8' },
        success: '#55C28A',
        warning: '#F2B84B',
        danger: '#FF6A61',
        info: '#62B8D3',
        teal: '#44D0BE',
        amber: '#F59E0B',
      },
      borderRadius: { card: '24px', field: '18px', glass: '28px' },
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
