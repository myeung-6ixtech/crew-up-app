/**
 * IANA-timezone formatting and conversion helpers. Deliberately dependency-free so
 * the zone math can be unit-tested outside the app bundle; `airportTime.ts` wraps
 * these with airport lookup.
 */

export const UTC = 'UTC';

/** Zones that resolved successfully, so a device with limited ICU is probed once. */
const verifiedZones = new Map<string, string>();

export function resolveTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return UTC;

  const cached = verifiedZones.get(timeZone);
  if (cached) return cached;

  let resolved = UTC;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    resolved = timeZone;
  } catch {
    resolved = UTC;
  }
  verifiedZones.set(timeZone, resolved);
  return resolved;
}

export function parseInstant(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function partsInZone(instant: Date, timeZone: string): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return Object.fromEntries(
    formatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
}

/** Local calendar day (YYYY-MM-DD) of an instant in the given zone. */
export function zoneDateKey(iso: string | null | undefined, timeZone: string): string | null {
  const instant = parseInstant(iso);
  if (!instant) return null;
  const parts = partsInZone(instant, resolveTimeZone(timeZone));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatZoneTime(iso: string | null | undefined, timeZone: string): string {
  const instant = parseInstant(iso);
  if (!instant) return '—';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: resolveTimeZone(timeZone),
    hour: 'numeric',
    minute: '2-digit',
  }).format(instant);
}

/** e.g. `8:35 AM HKT` — the zone label keeps cross-timezone pairings unambiguous. */
export function formatZoneTimeWithLabel(iso: string | null | undefined, timeZone: string): string {
  const instant = parseInstant(iso);
  if (!instant) return '—';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: resolveTimeZone(timeZone),
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(instant);
}

export function formatZoneDate(
  iso: string | null | undefined,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' },
): string {
  const instant = parseInstant(iso);
  if (!instant) return '—';
  return new Intl.DateTimeFormat(undefined, {
    timeZone: resolveTimeZone(timeZone),
    ...options,
  }).format(instant);
}

/**
 * Whole-day difference between two zone-local calendar dates. A value of 1 means
 * the later instant falls on the next local day.
 */
export function zoneDayOffset(
  fromIso: string | null | undefined,
  fromTimeZone: string,
  toIso: string | null | undefined,
  toTimeZone: string,
): number {
  const fromKey = zoneDateKey(fromIso, fromTimeZone);
  const toKey = zoneDateKey(toIso, toTimeZone);
  if (!fromKey || !toKey) return 0;
  const diffMs = Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`);
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = partsInZone(instant, timeZone);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - instant.getTime();
}

/**
 * Reads wall-clock fields as time in `timeZone` and returns the matching UTC
 * instant. Resolving the offset twice settles DST boundaries, where the first
 * guess can land on the wrong side of the transition.
 */
export function wallClockToUtc(wallClock: Date, timeZone: string): Date {
  const zone = resolveTimeZone(timeZone);
  const wallClockUtc = Date.UTC(
    wallClock.getFullYear(),
    wallClock.getMonth(),
    wallClock.getDate(),
    wallClock.getHours(),
    wallClock.getMinutes(),
    0,
    0,
  );

  let instant = wallClockUtc - zoneOffsetMs(new Date(wallClockUtc), zone);
  instant = wallClockUtc - zoneOffsetMs(new Date(instant), zone);
  return new Date(instant);
}

/**
 * Inverse of `wallClockToUtc`: a Date whose device-local wall-clock fields match
 * the zone-local time, so date/time pickers can display destination time.
 */
export function utcToWallClock(iso: string | null | undefined, timeZone: string): Date | null {
  const instant = parseInstant(iso);
  if (!instant) return null;
  const parts = partsInZone(instant, resolveTimeZone(timeZone));
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    0,
    0,
  );
}
