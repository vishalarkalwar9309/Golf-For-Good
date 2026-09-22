import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: number | null, currency: string = 'INR') {
  const numericVal = typeof amount === 'number' && !isNaN(amount) ? amount : (Number(amount) || 0);
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-GB', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: (numericVal % 1 === 0) ? 0 : 2,
  }).format(numericVal);
}

export function formatDate(date?: string | Date | null) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
