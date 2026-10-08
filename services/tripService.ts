import type { ApolloClient } from '@apollo/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';
import { DELETE_TRIP, GET_MY_TRIPS, GET_TRIP_HISTORY, GET_TRIP_MATCHES } from '@/graphql/queries/trips';
import type { ParsedRosterLeg, ParsedRosterTrip } from '@/types/domain';
import type { TripEntry, TripMatchEntry } from '@/types/trip';

async function authHeaders(): Promise<Record<string, string>> {
  const session = await nhost.refreshSession(60);
  if (!session?.accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  };
}

function createIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Backend-validated manual leg for routes a provider does not cover. */
export type ManualFlightLegInput = {
  flight_number: string;
  airline_iata?: string | null;
  departure_airport: string;
  arrival_airport: string;
  /** Local departure date at the origin airport (YYYY-MM-DD). */
  service_date: string;
  /** UTC instants converted from airport-local input. */
  scheduled_departure: string;
  scheduled_arrival: string;
};

export type TripLegInput = { selection_token: string } | { manual: ManualFlightLegInput };

export async function createTrip(input: {
  title?: string | null;
  source?: 'manual' | 'flight_search' | 'roster_upload' | 'airline_portal';
  visibility?: string | null;
  idempotencyKey?: string;
  legs?: TripLegInput[];
  stays?: Array<{
    city: string;
    airport_iata?: string | null;
    starts_at: string;
    ends_at: string;
  }>;
}): Promise<{ trip: TripEntry; match_status: string }> {
  const headers = await authHeaders();
  const response = await fetch(`${apiEndpoints.functions}/client/trips/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: input.title ?? null,
      source: input.source ?? 'manual',
      visibility: input.visibility ?? null,
      idempotency_key: input.idempotencyKey ?? createIdempotencyKey(),
      legs: input.legs ?? [],
      stays: input.stays ?? [],
    }),
  });

  const payload = (await response.json()) as {
    trip?: TripEntry;
    match_status?: string;
    message?: string;
    error?: { code?: string; message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? payload.message ?? 'Failed to create trip');
  }

  if (!payload.trip) {
    throw new Error('Failed to create trip');
  }

  return {
    trip: payload.trip,
    match_status: payload.match_status ?? 'pending',
  };
}

export async function updateTrip(input: {
  tripId: string;
  title?: string;
  visibility?: string;
  isActive?: boolean;
  stays?: Array<{
    id?: string;
    city: string;
    airport_iata?: string | null;
    starts_at: string;
    ends_at: string;
  }>;
}): Promise<TripEntry> {
  const headers = await authHeaders();
  const response = await fetch(`${apiEndpoints.functions}/client/trips/update`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      trip_id: input.tripId,
      title: input.title,
      visibility: input.visibility,
      is_active: input.isActive,
      stays: input.stays,
    }),
  });

  const payload = (await response.json()) as {
    trip?: TripEntry;
    message?: string;
  };
  if (!response.ok || !payload.trip) {
    throw new Error(payload.message ?? 'Failed to update trip');
  }
  return payload.trip;
}

export async function fetchMyTrips(
  client: ApolloClient,
  userId: string,
): Promise<{ all: TripEntry[]; upcoming: TripEntry[] }> {
  const { data } = await client.query({
    query: GET_MY_TRIPS,
    variables: { userId, now: new Date().toISOString() },
    fetchPolicy: 'network-only',
  });
  return {
    all: (data as { user_trips?: TripEntry[] }).user_trips ?? [],
    upcoming: (data as { upcomingTrips?: TripEntry[] }).upcomingTrips ?? [],
  };
}

export const TRIP_HISTORY_LIMIT = 20;

export async function fetchTripHistory(
  client: ApolloClient,
  userId: string,
): Promise<{ upcoming: TripEntry[]; past: TripEntry[] }> {
  const { data } = await client.query({
    query: GET_TRIP_HISTORY,
    variables: { userId, now: new Date().toISOString(), limit: TRIP_HISTORY_LIMIT },
    fetchPolicy: 'network-only',
  });
  const result = data as { upcomingTrips?: TripEntry[]; pastTrips?: TripEntry[] };
  return {
    upcoming: result.upcomingTrips ?? [],
    past: result.pastTrips ?? [],
  };
}

export async function fetchTripMatches(client: ApolloClient): Promise<TripMatchEntry[]> {
  const { data } = await client.query({
    query: GET_TRIP_MATCHES,
    fetchPolicy: 'network-only',
  });
  return (data as { trip_matches?: TripMatchEntry[] }).trip_matches ?? [];
}

export async function deactivateTrip(client: ApolloClient, tripId: string): Promise<void> {
  await client.mutate({
    mutation: DELETE_TRIP,
    variables: { id: tripId },
  });
}

export function dedupeTripMatches(matches: TripMatchEntry[]): TripMatchEntry[] {
  const byUser = new Map<string, TripMatchEntry>();
  for (const match of matches) {
    const existing = byUser.get(match.matched_user_id);
    if (!existing || match.score > existing.score) {
      byUser.set(match.matched_user_id, match);
    }
  }
  return Array.from(byUser.values()).sort((a, b) => b.score - a.score);
}

export async function createTripsFromRosterLayovers(
  entries: Array<{
    layoverCity?: string | null;
    layoverStart?: string | null;
    layoverEnd?: string | null;
    flightNumber?: string | null;
    departureAirport?: string | null;
    notes?: string | null;
  }>,
): Promise<void> {
  for (const entry of entries) {
    if (!entry.layoverCity?.trim() || !entry.layoverStart) continue;
    await createTrip({
      source: 'roster_upload',
      stays: [
        {
          city: entry.layoverCity.trim().toUpperCase(),
          starts_at: entry.layoverStart,
          ends_at: entry.layoverEnd ?? entry.layoverStart,
        },
      ],
    });
  }
}

/** Deterministic UUID-shaped key, so saving the same roster twice returns the trips it already made. */
function stableUuid(seed: string): string {
  let hex = '';
  for (let round = 0; hex.length < 32; round += 1) {
    let hash = 0x811c9dc5 ^ round;
    for (let index = 0; index < seed.length; index += 1) {
      hash ^= seed.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    hex += (hash >>> 0).toString(16).padStart(8, '0');
  }
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function rosterTripRoute(trip: ParsedRosterTrip): string {
  if (!trip.legs.length) return trip.layovers[0]?.layoverCity ?? '';
  return [trip.legs[0].departureAirport, ...trip.legs.map((leg) => leg.arrivalAirport)].join(' → ');
}

const FLIGHT_NUMBER = /^[A-Z0-9]{2,8}$/;
const AIRPORT_CODE = /^[A-Z]{3}$/;
const SERVICE_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The same checks trips/create applies to a manual leg, so one misread flight cannot fail the whole trip. */
function isSavableLeg(leg: ParsedRosterLeg): leg is ParsedRosterLeg & { flightNumber: string } {
  const departure = Date.parse(leg.scheduledDeparture);
  const arrival = Date.parse(leg.scheduledArrival);
  return (
    FLIGHT_NUMBER.test(leg.flightNumber ?? '') &&
    AIRPORT_CODE.test(leg.departureAirport) &&
    AIRPORT_CODE.test(leg.arrivalAirport) &&
    leg.departureAirport !== leg.arrivalAirport &&
    SERVICE_DATE.test(leg.serviceDate) &&
    Number.isFinite(departure) &&
    Number.isFinite(arrival) &&
    arrival >= departure
  );
}

export interface RosterSaveResult {
  /** Indexes into the input that were saved (or already existed). */
  saved: number[];
  failures: Array<{ index: number; route: string; message: string }>;
}

/**
 * One trip per pairing, holding its flights and the layovers between them. A trip
 * that fails is reported and the rest still save.
 */
export async function createTripsFromRoster(trips: ParsedRosterTrip[], sourceFileId?: string): Promise<RosterSaveResult> {
  const result: RosterSaveResult = { saved: [], failures: [] };
  for (const [index, trip] of trips.entries()) {
    const legs: TripLegInput[] = trip.legs
      .filter(isSavableLeg)
      .map((leg) => ({
        manual: {
          flight_number: leg.flightNumber,
          airline_iata: leg.flightNumber.slice(0, 2),
          departure_airport: leg.departureAirport,
          arrival_airport: leg.arrivalAirport,
          service_date: leg.serviceDate,
          scheduled_departure: leg.scheduledDeparture,
          scheduled_arrival: leg.scheduledArrival,
        },
      }));
    const stays = trip.layovers
      .filter((layover) => layover.layoverCity?.trim() && layover.layoverStart)
      .map((layover) => ({
        city: layover.layoverCity!.trim().toUpperCase(),
        airport_iata: layover.arrivalAirport && AIRPORT_CODE.test(layover.arrivalAirport) ? layover.arrivalAirport : null,
        starts_at: layover.layoverStart!,
        ends_at: layover.layoverEnd ?? layover.layoverStart!,
      }));
    const route = rosterTripRoute(trip);
    if (!legs.length && !stays.length) {
      result.failures.push({ index, route, message: 'No flight or layover in this trip could be read fully.' });
      continue;
    }

    const signature = trip.legs.map((leg) => `${leg.flightNumber}:${leg.scheduledDeparture}`).join('|');
    try {
      await createTrip({
        title: route || null,
        source: 'roster_upload',
        legs,
        stays,
        idempotencyKey: sourceFileId && signature ? stableUuid(`${sourceFileId}|${signature}`) : undefined,
      });
      result.saved.push(index);
    } catch (error) {
      result.failures.push({ index, route, message: error instanceof Error ? error.message : 'Failed to create trip' });
    }
  }
  return result;
}
