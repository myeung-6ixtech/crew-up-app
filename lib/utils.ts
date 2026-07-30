import clsx, { type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDateRange(start: string, end?: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : startDate;
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString(undefined, opts);
  }
  return `${startDate.toLocaleDateString(undefined, opts)} – ${endDate.toLocaleDateString(undefined, opts)}`;
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
