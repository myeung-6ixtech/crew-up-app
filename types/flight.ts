export type FlightOption = {
  id: string;
  flightNumber: string;
  airline: string;
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

export type FlightSearchErrorCode =
  | 'FLIGHT_API_NOT_CONFIGURED'
  | 'FLIGHT_API_RATE_LIMIT'
  | 'FLIGHT_API_QUOTA_EXCEEDED'
  | 'FLIGHT_API_PLAN_LIMIT'
  | 'FLIGHT_API_REQUEST_FAILED';

const FLIGHT_SEARCH_ERROR_CODES: readonly string[] = [
  'FLIGHT_API_NOT_CONFIGURED',
  'FLIGHT_API_RATE_LIMIT',
  'FLIGHT_API_QUOTA_EXCEEDED',
  'FLIGHT_API_PLAN_LIMIT',
  'FLIGHT_API_REQUEST_FAILED',
];

export function toFlightSearchErrorCode(error: unknown): FlightSearchErrorCode {
  const message = error instanceof Error ? error.message : '';
  return FLIGHT_SEARCH_ERROR_CODES.includes(message)
    ? (message as FlightSearchErrorCode)
    : 'FLIGHT_API_REQUEST_FAILED';
}
