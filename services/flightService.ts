import { searchFlightsAeroDataBox } from '@/services/aeroDataBoxFlightService';
import { searchFlightsAviationstack } from '@/services/aviationstackFlightService';
import { toFlightDateKey } from '@/lib/flightDateKey';
import type { FlightOption, FlightSearchParams } from '@/types/flight';

export type FlightProvider = 'aerodatabox' | 'aviationstack';

// Same-day results carry live status and gate data, so they expire far sooner
// than future schedules, which barely move.
const SAME_DAY_TTL_MS = 5 * 60 * 1000;
const SCHEDULE_TTL_MS = 12 * 60 * 60 * 1000;

type CacheEntry = {
  flights: FlightOption[];
  expiresAt: number;
};

const resultCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<FlightOption[]>>();

function buildCacheKey(provider: FlightProvider, params: FlightSearchParams): string {
  return `${provider}:${params.depIata}-${params.arrIata}-${toFlightDateKey(params.flightDate)}`;
}

function cacheTtlMs(flightDate: Date): number {
  return toFlightDateKey(flightDate) === toFlightDateKey(new Date())
    ? SAME_DAY_TTL_MS
    : SCHEDULE_TTL_MS;
}

function resolveProvider(): FlightProvider {
  const configured = process.env.EXPO_PUBLIC_FLIGHT_PROVIDER?.trim().toLowerCase();
  if (configured === 'aviationstack' || configured === 'aerodatabox') {
    return configured;
  }
  if (process.env.EXPO_PUBLIC_RAPIDAPI_KEY?.trim()) return 'aerodatabox';
  if (process.env.EXPO_PUBLIC_AVIATIONSTACK_API_KEY?.trim()) return 'aviationstack';
  return 'aerodatabox';
}

export function clearFlightSearchCache(): void {
  resultCache.clear();
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOption[]> {
  const provider = resolveProvider();
  const cacheKey = buildCacheKey(provider, params);

  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.flights;
  }

  // Every provider call costs metered quota, so identical searches that overlap
  // in time share one request instead of issuing their own.
  const pending = inFlightRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  const request = (
    provider === 'aviationstack'
      ? searchFlightsAviationstack(params)
      : searchFlightsAeroDataBox(params)
  )
    .then((flights) => {
      resultCache.set(cacheKey, {
        flights,
        expiresAt: Date.now() + cacheTtlMs(params.flightDate),
      });
      return flights;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);
  return request;
}
