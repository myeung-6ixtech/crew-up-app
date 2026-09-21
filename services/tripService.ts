import type { ApolloClient } from '@apollo/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';
import { DELETE_TRIP, GET_MY_TRIPS, GET_TRIP_MATCHES } from '@/graphql/queries/trips';
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
    if (entry.notes?.includes('duty:flight')) continue;
    if (entry.flightNumber && entry.departureAirport) continue;
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
