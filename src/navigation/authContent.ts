import { accentPalette } from '../theme/landing';

export type AuthEntryMode = 'signin' | 'signup';

export const AUTH_ENTRY_COPY: Record<
  AuthEntryMode,
  {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subcopy: string;
    accentColor: string;
    primaryLabel: string;
  }
> = {
  signin: {
    eyebrow: 'Sign in',
    title: 'Welcome ',
    titleAccent: 'back.',
    subcopy: 'Pick up where you left off with your pantry and lists.',
    accentColor: accentPalette.dustyBlue,
    primaryLabel: 'Sign In',
  },
  signup: {
    eyebrow: 'Get started',
    title: 'Create your ',
    titleAccent: 'account.',
    subcopy: 'Set up Larderly in under a minute.',
    accentColor: accentPalette.terracotta,
    primaryLabel: 'Create Account',
  },
};

export const AUTH_FLOW_COPY = {
  forgotPassword: {
    eyebrow: 'Recovery',
    title: 'Reset ',
    titleAccent: 'password.',
    subcopy: 'We will email you a link to choose a new password.',
    accentColor: accentPalette.clay,
    primaryLabel: 'Send reset link',
  },
  phoneSignIn: {
    eyebrow: 'Phone',
    title: 'Sign in with ',
    titleAccent: 'phone.',
    subcopy: 'We will text a one-time verification code.',
    accentColor: accentPalette.ochre,
    primaryLabel: 'Send code',
  },
  phoneVerify: {
    eyebrow: 'Verify',
    title: 'Enter ',
    titleAccent: 'code.',
    subcopy: 'Check your messages for the 6-digit code we sent.',
    accentColor: accentPalette.plum,
    primaryLabel: 'Verify code',
  },
  mfaVerify: {
    eyebrow: 'Security',
    title: 'Verify it is ',
    titleAccent: 'you.',
    subcopy: 'Enter the 6-digit code sent to your enrolled phone.',
    accentColor: accentPalette.teal,
    primaryLabel: 'Verify & sign in',
  },
} as const;
