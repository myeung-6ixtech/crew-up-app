import type { FlightOption, FlightSearchParams } from '@/types/flight';

type AdbTime = {
  utc?: string;
  local?: string;
};

type AdbAirport = {
  iata?: string;
  name?: string;
};

type AdbMovement = {
  scheduledTime?: AdbTime;
  revisedTime?: AdbTime;
};

type AdbDeparture = {
  number?: string;
  status?: string;
  departure?: AdbMovement;
  arrival?: {
    airport?: AdbAirport;
    scheduledTime?: AdbTime;
    revisedTime?: AdbTime;
  };
  airline?: {
    name?: string;
    iata?: string;
  };
};

type AdbFidsResponse = {
  departures?: AdbDeparture[];
  message?: string;
};

const DEFAULT_HOST = 'aerodatabox.p.rapidapi.com';

// RapidAPI rejects AeroDataBox calls that follow each other too closely, measured
// from when the previous one finished. Requests are therefore queued one at a time
// with at least this gap; anything shorter draws a 429 even with quota to spare.
const MIN_REQUEST_GAP_MS = 1500;
const RATE_LIMIT_RETRY_DELAY_MS = 2000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let requestChain: Promise<void> = Promise.resolve();
let lastRequestFinishedAt = 0;

function scheduleRequest<T>(run: () => Promise<T>): Promise<T> {
  const scheduled = requestChain.then(async () => {
    const waitFor = lastRequestFinishedAt + MIN_REQUEST_GAP_MS - Date.now();
    if (waitFor > 0) await delay(waitFor);
    try {
      return await run();
    } finally {
      lastRequestFinishedAt = Date.now();
    }
  });

  // The chain must keep flowing even when a request rejects, otherwise one
  // failure would block every later search.
  requestChain = scheduled.then(
    () => undefined,
    () => undefined,
  );

  return scheduled;
}

function toFlightDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseAdbUtcToIso(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeFlightNumber(value?: string): string | null {
  if (!value?.trim()) return null;
  return value.replace(/\s+/g, '').toUpperCase();
}

function mapDeparture(
  entry: AdbDeparture,
  index: number,
  dateKey: string,
  arrIata: string,
): FlightOption | null {
  const arrivalAirport = entry.arrival?.airport?.iata;
  if (arrivalAirport !== arrIata) return null;

  const flightNumber = normalizeFlightNumber(entry.number);
  const departureTime =
    parseAdbUtcToIso(entry.departure?.revisedTime?.utc) ??
    parseAdbUtcToIso(entry.departure?.scheduledTime?.utc);
  const arrivalTime =
    parseAdbUtcToIso(entry.arrival?.revisedTime?.utc) ??
    parseAdbUtcToIso(entry.arrival?.scheduledTime?.utc);

  if (!flightNumber || !departureTime || !arrivalTime) return null;

  return {
    id: `${flightNumber}-${departureTime}-${index}`,
    flightNumber,
    airline: entry.airline?.name ?? 'Unknown airline',
    departureAirport: '',
    arrivalAirport: arrIata,
    departureTime,
    arrivalTime,
    status: entry.status,
  };
}

function getRapidApiConfig() {
  const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY?.trim();
  const host = process.env.EXPO_PUBLIC_RAPIDAPI_AERODATABOX_HOST?.trim() || DEFAULT_HOST;
  return { apiKey, host };
}

function readNumericHeader(response: Response, name: string): number | null {
  const raw = response.headers.get(name);
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

// RapidAPI answers 429 both when the monthly allowance is gone and when requests
// arrive too fast, and only the quota headers tell the two apart.
function rateLimitErrorFor(response: Response): Error {
  const units = readNumericHeader(response, 'x-ratelimit-api-units-remaining');
  const requests = readNumericHeader(response, 'x-ratelimit-requests-remaining');

  if (__DEV__) {
    console.warn(
      `[aerodatabox] 429 — api units left: ${units ?? 'unknown'}, requests left: ${requests ?? 'unknown'}`,
    );
  }

  return units === 0 || requests === 0
    ? new Error('FLIGHT_API_QUOTA_EXCEEDED')
    : new Error('FLIGHT_API_RATE_LIMIT');
}

async function requestDepartures(
  depIata: string,
  fromLocal: string,
  toLocal: string,
): Promise<AdbDeparture[]> {
  const { apiKey, host } = getRapidApiConfig();
  if (!apiKey) {
    throw new Error('FLIGHT_API_NOT_CONFIGURED');
  }

  const path = `/flights/airports/iata/${encodeURIComponent(depIata)}/${fromLocal}/${toLocal}`;
  const url = new URL(`https://${host}${path}`);
  url.searchParams.set('direction', 'Departure');
  url.searchParams.set('withLeg', 'true');

  const response = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': host,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 429) {
    throw rateLimitErrorFor(response);
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('FLIGHT_API_NOT_CONFIGURED');
  }

  const payload = (await response.json()) as AdbFidsResponse;

  if (!response.ok) {
    if (__DEV__) {
      console.warn(`[aerodatabox] ${response.status} — ${payload.message ?? 'no message'}`);
    }
    throw new Error('FLIGHT_API_REQUEST_FAILED');
  }

  return payload.departures ?? [];
}

async function fetchAirportDepartures(
  depIata: string,
  fromLocal: string,
  toLocal: string,
): Promise<AdbDeparture[]> {
  try {
    return await scheduleRequest(() => requestDepartures(depIata, fromLocal, toLocal));
  } catch (e) {
    // A burst rejection costs no quota, so it is worth one spaced-out retry.
    // An exhausted allowance is not, and propagates immediately.
    if (e instanceof Error && e.message === 'FLIGHT_API_RATE_LIMIT') {
      await delay(RATE_LIMIT_RETRY_DELAY_MS);
      return scheduleRequest(() => requestDepartures(depIata, fromLocal, toLocal));
    }
    throw e;
  }
}

function dayWindows(dateKey: string): Array<{ from: string; to: string }> {
  return [
    { from: `${dateKey}T00:00`, to: `${dateKey}T11:59` },
    { from: `${dateKey}T12:00`, to: `${dateKey}T23:59` },
  ];
}

export async function searchFlightsAeroDataBox(
  params: FlightSearchParams,
): Promise<FlightOption[]> {
  const dateKey = toFlightDateKey(params.flightDate);

  // The endpoint caps each query at 12 hours, so a full day needs two of them.
  // They run in sequence rather than in parallel so the request scheduler can
  // space them out, and so a rejected first window never spends quota on a second.
  const departures: AdbDeparture[] = [];
  for (const window of dayWindows(dateKey)) {
    const batch = await fetchAirportDepartures(params.depIata, window.from, window.to);
    departures.push(...batch);
  }

  const seen = new Set<string>();
  const flights: FlightOption[] = [];

  departures.forEach((entry, index) => {
    const mapped = mapDeparture(entry, index, dateKey, params.arrIata);
    if (!mapped) return;

    const dedupeKey = `${mapped.flightNumber}-${mapped.departureTime}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    flights.push({
      ...mapped,
      departureAirport: params.depIata,
      id: dedupeKey,
    });
  });

  return flights.sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
  );
}
