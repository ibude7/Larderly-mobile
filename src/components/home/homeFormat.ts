export function relativeAddedLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (then >= startOfToday.getTime()) return 'Today';
  if (then >= startOfYesterday.getTime()) return 'Yesterday';
  const days = Math.max(1, Math.round((Date.now() - then) / 86_400_000));
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function expiryCountdownLabel(days: number | null): string {
  if (days === null) return '';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return 'in 1 day';
  return `in ${days} days`;
}
