import { findAirportByIata } from '@/constants/airports';
import {
  UTC,
  formatZoneDate,
  formatZoneTime,
  formatZoneTimeWithLabel,
  resolveTimeZone,
  wallClockToUtc,
  utcToWallClock,
  zoneDateKey,
  zoneDayOffset,
} from '@/lib/timeZone';

/** Falls back to UTC for airports outside the static list or unsupported zones. */
export function airportTimeZone(iata: string | null | undefined): string {
  const airport = findAirportByIata(iata);
  return airport ? resolveTimeZone(airport.timeZone) : UTC;
}

/**
 * Local calendar day at an airport, used to detect arrivals that land on a
 * different date than they departed.
 */
export function airportDateKey(
  iso: string | null | undefined,
  iata: string | null | undefined,
): string | null {
  return zoneDateKey(iso, airportTimeZone(iata));
}

export function formatAirportTime(
  iso: string | null | undefined,
  iata: string | null | undefined,
): string {
  return formatZoneTime(iso, airportTimeZone(iata));
}

export function formatAirportTimeWithZone(
  iso: string | null | undefined,
  iata: string | null | undefined,
): string {
  return formatZoneTimeWithLabel(iso, airportTimeZone(iata));
}

export function formatAirportDate(
  iso: string | null | undefined,
  iata: string | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  return formatZoneDate(iso, airportTimeZone(iata), options);
}

/**
 * Whole-day difference between departure and arrival in each airport's own local
 * time. A value of 1 means the flight arrives the next local day.
 */
export function airportDayOffset(
  departureIso: string | null | undefined,
  departureIata: string | null | undefined,
  arrivalIso: string | null | undefined,
  arrivalIata: string | null | undefined,
): number {
  return zoneDayOffset(
    departureIso,
    airportTimeZone(departureIata),
    arrivalIso,
    airportTimeZone(arrivalIata),
  );
}

/** Reads a picker value as airport-local time and returns the UTC instant. */
export function airportLocalToUtc(wallClock: Date, iata: string | null | undefined): Date {
  return wallClockToUtc(wallClock, airportTimeZone(iata));
}

/** Produces a picker value whose wall-clock fields show airport-local time. */
export function utcToAirportLocalWallClock(
  iso: string | null | undefined,
  iata: string | null | undefined,
): Date | null {
  return utcToWallClock(iso, airportTimeZone(iata));
}
