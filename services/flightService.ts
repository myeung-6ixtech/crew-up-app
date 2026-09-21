import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';
import { toFlightDateKey } from '@/lib/flightDateKey';
import type { FlightOption, FlightSearchParams, FlightSearchResult } from '@/types/flight';

type FlightSearchResponse = {
  search_id?: string;
  cached?: boolean;
  expires_at?: string;
  cache_expires_at?: string;
  flights?: Array<{
    result_id: string;
    selection_token: string;
    flight_number: string;
    airline_iata?: string | null;
    airline_name: string;
    departure_airport: string;
    arrival_airport: string;
    scheduled_departure: string;
    scheduled_arrival: string;
    status?: string | null;
  }>;
  error?: { code?: string; message?: string };
  message?: string;
};

/**
 * Only in-flight requests are shared. Results are never cached on the device: the
 * backend owns schedule caching, and selection tokens expire well before a device
 * cache would, so a cached list could hand the user an unusable token.
 */
const inFlightRequests = new Map<string, Promise<FlightSearchResult>>();

function buildRequestKey(params: FlightSearchParams): string {
  return `${params.depIata}-${params.arrIata}-${toFlightDateKey(params.flightDate)}`;
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
  const requestKey = buildRequestKey(params);
  const pending = inFlightRequests.get(requestKey);
  if (pending) return pending;

  const request = (async (): Promise<FlightSearchResult> => {
    const session = await nhost.refreshSession(60);
    if (!session?.accessToken) {
      throw new Error('FLIGHT_SEARCH_UNAUTHENTICATED');
    }

    const response = await fetch(`${apiEndpoints.functions}/client/flights/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        departure_airport: params.depIata,
        arrival_airport: params.arrIata,
        flight_date: toFlightDateKey(params.flightDate),
      }),
    });

    let payload: FlightSearchResponse = {};
    try {
      payload = (await response.json()) as FlightSearchResponse;
    } catch {
      payload = {};
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('FLIGHT_SEARCH_UNAUTHENTICATED');
      }
      throw new Error(payload.error?.code ?? 'FLIGHT_SEARCH_FAILED');
    }

    const flights: FlightOption[] = (payload.flights ?? []).map((flight) => ({
      id: flight.result_id,
      selectionToken: flight.selection_token,
      flightNumber: flight.flight_number,
      airline: flight.airline_name,
      airlineIata: flight.airline_iata ?? undefined,
      departureAirport: flight.departure_airport,
      arrivalAirport: flight.arrival_airport,
      departureTime: flight.scheduled_departure,
      arrivalTime: flight.scheduled_arrival,
      status: flight.status ?? undefined,
    }));

    return {
      flights,
      cached: payload.cached === true,
      selectionExpiresAt: payload.expires_at ?? null,
    };
  })().finally(() => {
    inFlightRequests.delete(requestKey);
  });

  inFlightRequests.set(requestKey, request);
  return request;
}
