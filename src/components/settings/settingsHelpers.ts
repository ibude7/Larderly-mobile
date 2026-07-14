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
