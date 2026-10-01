import { AIRPORTS, findAirportByIata } from '@/constants/airports';
import { formatAirportDate } from '@/lib/airportTime';
import type { TripMatchEntry, TripMatchType } from '@/types/trip';

export type Closeness = 'flight' | 'route' | 'city';

export const CLOSENESS_BY_TYPE: Record<TripMatchType, Closeness> = {
  same_flight: 'flight',
  same_route: 'route',
  layover_overlap: 'city',
};

/** A stay of about eight hours or more is the one worth surfacing first. */
export const LONG_REST_HOURS = 8;

/** IATA code for the place a match happens: arrival airport, a code in `city`, or the city's main airport. */
export function matchAirportCode(match: TripMatchEntry): string | null {
  if (match.match_type !== 'layover_overlap' && match.arrival_airport) return match.arrival_airport;
  const city = match.city?.trim() ?? '';
  if (/^[A-Z]{3}$/.test(city) && findAirportByIata(city)) return city;
  const byCity = AIRPORTS.find((airport) => airport.city.toLowerCase() === city.toLowerCase());
  return byCity?.iata ?? match.arrival_airport ?? null;
}

export function matchCityName(match: TripMatchEntry): string {
  const code = matchAirportCode(match);
  return findAirportByIata(code)?.city ?? match.city ?? code ?? '';
}

export function overlapHours(match: TripMatchEntry): number | null {
  if (!match.overlap_start || !match.overlap_end) return null;
  const ms = new Date(match.overlap_end).getTime() - new Date(match.overlap_start).getTime();
  return ms > 0 ? ms / 3_600_000 : null;
}

/** "30H 40M OVERLAP" / "45M OVERLAP". */
export function overlapLabel(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}M`;
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes ? `${whole}H ${minutes}M` : `${whole}H`;
}

/** "HKG · 8 Oct, 14:35 – 9 Oct, 21:15", in local time at that airport. */
export function overlapWindow(match: TripMatchEntry): string | null {
  if (!match.overlap_start || !match.overlap_end) return null;
  const code = matchAirportCode(match);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false };
  const start = formatAirportDate(match.overlap_start, code, options);
  const end = formatAirportDate(match.overlap_end, code, options);
  return [code ?? match.city, `${start} – ${end}`].filter(Boolean).join(' · ');
}

/** Free-text city or IATA query against a match's place. */
export function matchesPlace(match: TripMatchEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const code = matchAirportCode(match)?.toLowerCase();
  const city = matchCityName(match).toLowerCase();
  return code === needle || city.includes(needle) || (match.city ?? '').toLowerCase().includes(needle);
}

/** Overlaps that have already ended drop off the list. */
export function isCurrent(match: TripMatchEntry, now = Date.now()): boolean {
  return !match.overlap_end || new Date(match.overlap_end).getTime() >= now;
}
