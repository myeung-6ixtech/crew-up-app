/**
 * Chat day labels, WhatsApp-style: "Today", "Yesterday", a weekday within the last week ("Monday"), then a date
 * ("Mon 16 Nov", with the year when it isn't this year). Always in the reader's own time zone.
 * Dependency-free so it's unit-tested (scripts/chat-day.test.mjs).
 */
export function dayKey(iso: string | null | undefined): string {
  const at = iso ? new Date(iso) : null;
  if (!at || Number.isNaN(at.getTime())) return '';
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
}

/** Whole local days between two dates (now minus then). */
function daysAgo(at: Date, now: Date): number {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((start(now) - start(at)) / 86_400_000);
}

export function dayLabel(iso: string, labels: { today: string; yesterday: string }, now: Date = new Date(), locale = 'en-GB'): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const ago = daysAgo(at, now);
  if (ago <= 0) return labels.today;
  if (ago === 1) return labels.yesterday;
  if (ago < 7) return at.toLocaleDateString(locale, { weekday: 'long' });
  const sameYear = at.getFullYear() === now.getFullYear();
  return at.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) }).replace(',', '');
}

export type DayRow = { kind: 'day'; id: string; at: string };

/** Messages have a `kind` too ('text', 'wave'), so tell rows apart by the day kind itself. */
export function isDayRow(row: unknown): row is DayRow {
  return (row as DayRow | null)?.kind === 'day';
}

/**
 * Rows for an inverted chat list (newest first): each message, and a day divider after the last (oldest) message of
 * each day, so on screen the divider sits above that day's first message.
 */
export function withDayDividers<T extends { id: string; created_at: string }>(newestFirst: T[]): Array<T | DayRow> {
  const rows: Array<T | DayRow> = [];
  newestFirst.forEach((message, index) => {
    rows.push(message);
    const older = newestFirst[index + 1];
    if (!older || dayKey(older.created_at) !== dayKey(message.created_at)) {
      rows.push({ kind: 'day', id: `day:${dayKey(message.created_at)}`, at: message.created_at });
    }
  });
  return rows;
}
