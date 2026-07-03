const MS_PER_DAY = 86400000;

export function parseStoredDate(date: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  return new Date(date);
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysUntilDate(date: string | null, from = new Date()): number | null {
  if (!date) return null;

  const target = parseStoredDate(date);
  if (Number.isNaN(target.getTime())) return null;

  const current = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0, 0);

  return Math.round((target.getTime() - current.getTime()) / MS_PER_DAY);
}
