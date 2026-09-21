export type FlightOption = {
  id: string;
  selectionToken?: string;
  flightNumber: string;
  airline: string;
  airlineIata?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  status?: string;
};

export type FlightSearchParams = {
  depIata: string;
  arrIata: string;
  flightDate: Date;
};

export type FlightSearchResult = {
  flights: FlightOption[];
  /** True when the backend served this list from its shared schedule cache. */
  cached: boolean;
  /** Deadline for using the returned selection tokens. */
  selectionExpiresAt: string | null;
};

/**
 * User-facing outcomes only. Provider and cache specifics stay in Nhost logs so
 * crew never see vendor error codes.
 */
export type FlightSearchErrorCode =
  'FLIGHT_SCHEDULE_UNAVAILABLE' | 'FLIGHT_SEARCH_UNAUTHENTICATED' | 'FLIGHT_SEARCH_FAILED';

const FLIGHT_SEARCH_ERROR_CODES: readonly string[] = [
  'FLIGHT_SCHEDULE_UNAVAILABLE',
  'FLIGHT_SEARCH_UNAUTHENTICATED',
  'FLIGHT_SEARCH_FAILED',
];

export function toFlightSearchErrorCode(error: unknown): FlightSearchErrorCode {
  const message = error instanceof Error ? error.message : '';
  return FLIGHT_SEARCH_ERROR_CODES.includes(message)
    ? (message as FlightSearchErrorCode)
    : 'FLIGHT_SEARCH_FAILED';
}
