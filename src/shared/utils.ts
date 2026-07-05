export function hasToMillis(value: unknown): value is { toMillis: () => number } {
  return typeof value === 'object' && value !== null && 'toMillis' in value;
}

export function toIsoString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (hasToMillis(value)) return new Date(value.toMillis()).toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  return new Date().toISOString();
}

export function toExpiryIso(expirationDate?: number | null): string | null {
  if (!expirationDate) return null;
  return new Date(expirationDate).toISOString().slice(0, 10);
}

export function toExpirationMs(expiryDate: string | null | undefined): number | undefined {
  if (!expiryDate) return undefined;
  const ms = new Date(expiryDate).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}
