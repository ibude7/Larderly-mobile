/**
 * Larderly brand accents — vibrant palette aligned with logo orange energy.
 */

export const brandOrange = {
  light: '#fb923c',
  DEFAULT: '#f97316',
  dark: '#ea580c',
  glow: 'rgba(249, 115, 22, 0.18)',
  halo: 'rgba(249, 115, 22, 0.25)',
  border: 'rgba(251, 146, 60, 0.6)',
  gradient: ['#fb923c', '#f97316', '#ea580c'] as const,
} as const;

export const brandOrangeDark = {
  primary: brandOrange.light,
  primaryDark: brandOrange.DEFAULT,
  glow: 'rgba(251, 146, 60, 0.22)',
} as const;

export const brandRose = {
  light: '#fb7185',
  DEFAULT: '#f43f5e',
  dark: '#e11d48',
  glow: 'rgba(244, 63, 94, 0.18)',
  halo: 'rgba(244, 63, 94, 0.22)',
} as const;

export const brandRoseDark = {
  primary: brandRose.light,
  primaryDark: brandRose.DEFAULT,
  glow: 'rgba(251, 113, 133, 0.22)',
} as const;

export const brandBlue = {
  light: '#60a5fa',
  DEFAULT: '#3b82f6',
  dark: '#2563eb',
  glow: 'rgba(59, 130, 246, 0.18)',
  halo: 'rgba(59, 130, 246, 0.22)',
} as const;

export const brandBlueDark = {
  primary: brandBlue.light,
  primaryDark: brandBlue.DEFAULT,
  glow: 'rgba(96, 165, 250, 0.22)',
} as const;

export const brandGreen = {
  light: '#34d399',
  DEFAULT: '#10b981',
  dark: '#059669',
  glow: 'rgba(16, 185, 129, 0.18)',
  halo: 'rgba(16, 185, 129, 0.22)',
} as const;

export const brandGreenDark = {
  primary: brandGreen.light,
  primaryDark: brandGreen.DEFAULT,
  glow: 'rgba(52, 211, 153, 0.22)',
} as const;

export const brandPurple = {
  light: '#c084fc',
  DEFAULT: '#a855f7',
  dark: '#9333ea',
  glow: 'rgba(168, 85, 247, 0.18)',
  halo: 'rgba(168, 85, 247, 0.22)',
} as const;

export const brandPurpleDark = {
  primary: brandPurple.light,
  primaryDark: brandPurple.DEFAULT,
  glow: 'rgba(192, 132, 252, 0.22)',
} as const;

export const brandTeal = {
  light: '#2dd4bf',
  DEFAULT: '#14b8a6',
  dark: '#0d9488',
  glow: 'rgba(20, 184, 166, 0.18)',
  halo: 'rgba(20, 184, 166, 0.22)',
} as const;

export const brandTealDark = {
  primary: brandTeal.light,
  primaryDark: brandTeal.DEFAULT,
  glow: 'rgba(45, 212, 191, 0.22)',
} as const;
