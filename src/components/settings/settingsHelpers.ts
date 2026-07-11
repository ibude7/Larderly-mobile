export const LOCATION_COLORS = [
  '#3b82f6',
  '#06b6d4',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#10b981',
  '#ec4899',
  '#64748b',
] as const;

export function describeProvider(providerIds: string[], isAnonymous: boolean): string {
  if (isAnonymous) return 'Guest';
  const ids = new Set(providerIds);
  if (ids.has('google.com')) return 'Google';
  if (ids.has('apple.com')) return 'Apple';
  if (ids.has('password')) return 'Email';
  return 'Signed in';
}

export type SettingsSectionKey =
  | 'account'
  | 'household'
  | 'notifications'
  | 'security'
  | 'data'
  | 'preferences'
  | 'support';

/** Distinct per-section identity color, echoing the onboarding step accent system. */
export const SETTINGS_SECTION_COLORS: Record<SettingsSectionKey, string> = {
  account: '#C2662D', // terracotta
  household: '#6E8B5A', // sage
  notifications: '#C79A3D', // ochre
  security: '#5B7B93', // dustyBlue
  data: '#4F8B85', // teal
  preferences: '#8B6B9E', // plum
  support: '#8B6B9E', // plum (shared identity with preferences family)
};
