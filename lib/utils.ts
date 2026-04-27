import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(value: string | Date, lang: 'ar' | 'en' = 'en') {
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return String(value);
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#22c55e',
    completed: '#3b82f6',
    cancelled: '#ef4444',
    active: '#22c55e',
    trial: '#3b82f6',
    pending_approval: '#f59e0b',
    paused: '#9ca3af',
  };
  return colors[status] || '#9ca3af';
}

export function formatDate(value: string | Date, lang: 'ar' | 'en' = 'en') {
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
    }).format(d);
  } catch {
    return String(value);
  }
}
