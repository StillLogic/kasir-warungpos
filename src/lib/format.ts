export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Round a number to the nearest thousand
 * Examples: 5800 → 6000, 5400 → 5000
 */
export function roundToThousand(amount: number): number {
  return Math.round(amount / 1000) * 1000;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'short',
  }).format(new Date(date));
}
