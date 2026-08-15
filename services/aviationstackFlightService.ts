import type { FlightOption, FlightSearchParams } from '@/types/flight';

type AviationstackFlight = {
  flight_date?: string;
  flight?: { iata?: string; number?: string };
  airline?: { name?: string };
  departure?: { iata?: string; scheduled?: string };
  arrival?: { iata?: string; scheduled?: string };
  flight_status?: string;
};

type AviationstackResponse = {
  data?: AviationstackFlight[];
  error?: { code?: string; message?: string };
};

const API_BASE = 'https://api.aviationstack.com/v1';

function toFlightDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapFlight(entry: AviationstackFlight, index: number, dateKey: string): FlightOption | null {
  const flightNumber = entry.flight?.iata ?? entry.flight?.number;
  const departureAirport = entry.departure?.iata;
  const arrivalAirport = entry.arrival?.iata;
  const departureTime = entry.departure?.scheduled;
  const arrivalTime = entry.arrival?.scheduled;

  if (!flightNumber || !departureAirport || !arrivalAirport || !departureTime || !arrivalTime) {
    return null;
  }

  return {
    id: `${flightNumber}-${dateKey}-${index}`,
    flightNumber,
    airline: entry.airline?.name ?? 'Unknown airline',
    departureAirport,
    arrivalAirport,
    departureTime,
    arrivalTime,
    status: entry.flight_status,
  };
}

export async function searchFlightsAviationstack(
  params: FlightSearchParams,
): Promise<FlightOption[]> {
  const accessKey = process.env.EXPO_PUBLIC_AVIATIONSTACK_API_KEY?.trim();
  const dateKey = toFlightDateKey(params.flightDate);

  if (!accessKey) {
    throw new Error('FLIGHT_API_NOT_CONFIGURED');
  }

  const url = new URL(`${API_BASE}/flights`);
  url.searchParams.set('access_key', accessKey);
  url.searchParams.set('dep_iata', params.depIata);
  url.searchParams.set('arr_iata', params.arrIata);
  url.searchParams.set('limit', '100');

  const response = await fetch(url.toString());
  const payload = (await response.json()) as AviationstackResponse;

  if (payload.error?.message) {
    if (payload.error.code === 'function_access_restricted') {
      throw new Error('FLIGHT_API_PLAN_LIMIT');
    }
    throw new Error(payload.error.message);
  }

  if (!response.ok) {
    throw new Error('FLIGHT_API_REQUEST_FAILED');
  }

  const flights = (payload.data ?? [])
    .filter((entry) => entry.flight_date === dateKey)
    .map((entry, index) => mapFlight(entry, index, dateKey))
    .filter((entry): entry is FlightOption => entry !== null);

  return flights.sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
  );
}
