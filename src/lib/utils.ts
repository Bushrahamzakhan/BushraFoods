import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureDate(date: any): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000);
  }
  return new Date(date);
}
