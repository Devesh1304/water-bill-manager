import { DateFilter, DateRange } from '../types';

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function getDateRange(filter: DateFilter): DateRange {
  const now = new Date();
  if (filter === 'today') {
    const today = toDateString(now);
    return { start: today, end: today };
  }
  if (filter === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { start: toDateString(start), end: toDateString(now) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: toDateString(start), end: toDateString(now) };
}

export function isWithinRange(date: string, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function formatDisplayDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}-${m}-${y.slice(2)}`;
}
