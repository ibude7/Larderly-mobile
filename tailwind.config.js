/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Settings / warm editorial theme (global)
        primary: {
          DEFAULT: '#C2662D',
          dark: '#E08A5A',
          glow: 'rgba(194,102,45,0.14)',
        },
        secondary: { DEFAULT: '#C79A3D', dark: '#E0B85C' },
        accent: { DEFAULT: '#4F8B85', dark: '#6BA8A1' },
        canvas: { DEFAULT: '#F4F1E8', dark: '#101010' },
        'canvas-raised': { DEFAULT: '#FBF8EF', dark: '#171713' },
        surface: { DEFAULT: '#FFFDF6', dark: '#1E1D19' },
        'surface-muted': { DEFAULT: '#E7E0D1', dark: '#2A2822' },
        'surface-elevated': { DEFAULT: '#FFFFFF', dark: '#26241F' },
        ink: { DEFAULT: '#101010', dark: '#FFFDF6' },
        'ink-soft': { DEFAULT: '#38342D', dark: '#E6DFD0' },
        line: { DEFAULT: '#1B1B1B', dark: 'rgba(255,253,246,0.14)' },
        muted: { DEFAULT: '#6D665B', dark: '#B6AC9A' },
        subtle: { DEFAULT: '#8C8375', dark: '#918778' },
        success: { DEFAULT: '#3D7A4A', dark: '#8AAF72' },
        warning: { DEFAULT: '#C79A3D', dark: '#E0B85C' },
        danger: { DEFAULT: '#B54A3A', dark: '#E07A6A' },
        info: { DEFAULT: '#5B7B93', dark: '#7A9BB0' },
        teal: { DEFAULT: '#4F8B85', dark: '#6BA8A1' },
        amber: { DEFAULT: '#C79A3D', dark: '#E0B85C' },
      },
      borderRadius: { card: '8px', field: '8px', glass: '8px', bento: '8px' },
      borderWidth: { 3: '3px' },
      fontFamily: {
        sans: ['Outfit_400Regular', 'System'],
        medium: ['Outfit_500Medium', 'System'],
        semibold: ['Outfit_600SemiBold', 'System'],
        bold: ['Outfit_700Bold', 'System'],
        black: ['Outfit_800ExtraBold', 'System'],
        display: ['Fraunces_600SemiBold', 'serif'],
        'display-bold': ['Fraunces_700Bold', 'serif'],
      },
    },
  },
  plugins: [],
};
