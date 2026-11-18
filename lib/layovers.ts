/**
 * Layovers for "Your trips" (frame 5B): free time on the ground, built from the same trips as the Trips view.
 * Dependency-free (types only) so the maths can be unit-tested in Node (scripts/layovers.test.mjs).
 *
 * A trip's saved stays are its layovers (landed → free until). A trip with a flight but no saved stay falls back to
 * the gap between that flight's arrival and the next saved flight that departs from the same airport.
 */
import type { TripEntry } from '../types/trip';

/** Under this a layover is a connection: minutes only, never styled like a long layover. */
export const SHORT_LAYOVER_MINUTES = 60;

export type Layover = {
  /** Stay id, or `gap:{tripId}` for a layover worked out from the next departure. */
  id: string;
  tripId: string;
  city: string;
  airportIata: string | null;
  /** Landed (start of free time), ISO. */
  startsAt: string;
  /** Free until, ISO. */
  endsAt: string;
  minutes: number;
  /** Under an hour: a connection. */
  short: boolean;
  /** Worked out from the next departure rather than a saved stay. */
  derived: boolean;
};

export type LayoverSummary = {
  totalMinutes: number;
  count: number;
  longest: Layover | null;
};

const ms = (iso: string | null | undefined) => {
  if (!iso) return NaN;
  return Date.parse(iso);
};

const minutesBetween = (startIso: string, endIso: string) => Math.round((ms(endIso) - ms(startIso)) / 60_000);

function firstFlight(trip: TripEntry) {
  return trip.flightLegs?.[0]?.flight ?? null;
}

/**
 * Upcoming layovers (still free at or after `nowMs`), earliest first.
 * `cityFor` names a place from its stored city and airport (the app passes the airport list's city).
 */
export function upcomingLayovers(
  trips: TripEntry[],
  options: { nowMs?: number; cityFor?: (city: string | null, iata: string | null) => string } = {},
): Layover[] {
  const nowMs = options.nowMs ?? Date.now();
  const cityFor = options.cityFor ?? ((city, iata) => city || iata || '');
  const layovers: Layover[] = [];

  // Saved stays first.
  for (const trip of trips) {
    for (const stay of trip.stays ?? []) {
      const minutes = minutesBetween(stay.starts_at, stay.ends_at);
      if (!Number.isFinite(minutes) || minutes <= 0 || ms(stay.ends_at) < nowMs) continue;
      layovers.push({
        id: stay.id,
        tripId: trip.id,
        city: cityFor(stay.city, stay.airport_iata ?? null),
        airportIata: stay.airport_iata ?? null,
        startsAt: stay.starts_at,
        endsAt: stay.ends_at,
        minutes,
        short: minutes < SHORT_LAYOVER_MINUTES,
        derived: false,
      });
    }
  }

  // No saved stay: arrival → the next departure from the same airport.
  const flights = trips
    .map((trip) => ({ trip, flight: firstFlight(trip) }))
    .filter((row): row is { trip: TripEntry; flight: NonNullable<ReturnType<typeof firstFlight>> } => Boolean(row.flight))
    .sort((a, b) => ms(a.flight.scheduled_departure) - ms(b.flight.scheduled_departure));
  for (const { trip, flight } of flights) {
    if (trip.stays?.length) continue;
    const arrival = ms(flight.scheduled_arrival);
    if (!Number.isFinite(arrival)) continue;
    const next = flights.find(
      (row) => row.trip.id !== trip.id && row.flight.departure_airport === flight.arrival_airport && ms(row.flight.scheduled_departure) > arrival,
    );
    if (!next || ms(next.flight.scheduled_departure) < nowMs) continue;
    const minutes = minutesBetween(flight.scheduled_arrival, next.flight.scheduled_departure);
    if (minutes <= 0) continue;
    layovers.push({
      id: `gap:${trip.id}`,
      tripId: trip.id,
      city: cityFor(null, flight.arrival_airport),
      airportIata: flight.arrival_airport,
      startsAt: flight.scheduled_arrival,
      endsAt: next.flight.scheduled_departure,
      minutes,
      short: minutes < SHORT_LAYOVER_MINUTES,
      derived: true,
    });
  }

  return layovers.sort((a, b) => ms(a.startsAt) - ms(b.startsAt));
}

/** Total free time, how many layovers, and the longest one. */
export function summarizeLayovers(layovers: Layover[]): LayoverSummary {
  let longest: Layover | null = null;
  let totalMinutes = 0;
  for (const layover of layovers) {
    totalMinutes += layover.minutes;
    if (!longest || layover.minutes > longest.minutes) longest = layover;
  }
  return { totalMinutes, count: layovers.length, longest };
}

/** "8h 00m", "28h 55m"; under an hour, minutes only ("45m"). */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total}m`;
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m`;
}
