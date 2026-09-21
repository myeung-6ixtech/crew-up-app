import { airportDayOffset, formatAirportDate, formatAirportTimeWithZone } from '@/lib/airportTime';

export type TripSource = 'manual' | 'flight_search' | 'roster_upload' | 'airline_portal';

export type TripMatchType = 'same_flight' | 'same_route' | 'layover_overlap';

export type TripFlight = {
  id: string;
  airline_iata?: string | null;
  flight_number: string;
  /** Airline service day, already local to the departure airport. */
  service_date?: string | null;
  departure_airport: string;
  arrival_airport: string;
  scheduled_departure: string;
  scheduled_arrival: string;
};

export type TripEntry = {
  id: string;
  title?: string | null;
  source?: TripSource | null;
  starts_at?: string | null;
  ends_at?: string | null;
  visibility?: string | null;
  is_active?: boolean | null;
  flightLegs?: Array<{
    id: string;
    sequence_number?: number;
    flight: TripFlight;
  }>;
  stays?: Array<{
    id: string;
    city: string;
    airport_iata?: string | null;
    starts_at: string;
    ends_at: string;
  }>;
};

export type TripMatchEntry = {
  id: string;
  matched_user_id: string;
  match_type: TripMatchType;
  score: number;
  city?: string | null;
  flight_number?: string | null;
  departure_airport?: string | null;
  arrival_airport?: string | null;
  overlap_start?: string | null;
  overlap_end?: string | null;
  matchedUser?: {
    profile?: {
      display_name?: string | null;
      role_type?: string | null;
      base_airport?: string | null;
    } | null;
  } | null;
};

export function tripRouteLabel(trip: TripEntry): string {
  const leg = trip.flightLegs?.[0]?.flight;
  if (leg) {
    return `${leg.departure_airport} → ${leg.arrival_airport}`;
  }
  const stay = trip.stays?.[0];
  return stay?.city ?? trip.title ?? 'Trip';
}

export function tripDestinationLabel(trip: TripEntry): string | null {
  const leg = trip.flightLegs?.[0]?.flight;
  if (leg) return leg.arrival_airport;
  return trip.stays?.[0]?.city ?? null;
}

export function tripFlight(trip: TripEntry): TripFlight | null {
  return trip.flightLegs?.[0]?.flight ?? null;
}

/** `CX255` or `CX255 · HKG → LHR` when the route adds context. */
export function tripFlightLabel(trip: TripEntry, options?: { withRoute?: boolean }): string | null {
  const flight = tripFlight(trip);
  if (!flight) return null;
  if (!options?.withRoute) return flight.flight_number;
  return `${flight.flight_number} · ${flight.departure_airport} → ${flight.arrival_airport}`;
}

/**
 * Departure and arrival in each airport's own local time, which is how crew read
 * a roster. Falls back to the layover window for trips without a flight leg.
 */
export function tripScheduleLabel(trip: TripEntry): string | null {
  const flight = tripFlight(trip);
  if (flight) {
    const departure = formatAirportTimeWithZone(
      flight.scheduled_departure,
      flight.departure_airport,
    );
    const arrival = formatAirportTimeWithZone(flight.scheduled_arrival, flight.arrival_airport);
    const dayOffset = airportDayOffset(
      flight.scheduled_departure,
      flight.departure_airport,
      flight.scheduled_arrival,
      flight.arrival_airport,
    );
    const rollover = dayOffset > 0 ? ` (+${dayOffset}d)` : dayOffset < 0 ? ` (${dayOffset}d)` : '';
    return `${departure} → ${arrival}${rollover}`;
  }

  const stay = trip.stays?.[0];
  if (!stay) return null;
  const zoneIata = stay.airport_iata ?? null;
  return `${formatAirportTimeWithZone(stay.starts_at, zoneIata)} – ${formatAirportTimeWithZone(stay.ends_at, zoneIata)}`;
}

export function tripDepartureDateLabel(trip: TripEntry): string | null {
  const flight = tripFlight(trip);
  if (flight) {
    return formatAirportDate(flight.scheduled_departure, flight.departure_airport);
  }
  const stay = trip.stays?.[0];
  if (!stay) return null;
  return formatAirportDate(stay.starts_at, stay.airport_iata ?? null);
}

export function tripAvailabilityLabel(trip: TripEntry): string | null {
  const stay = trip.stays?.[0];
  if (stay) {
    const zoneIata = stay.airport_iata ?? null;
    const start = `${formatAirportDate(stay.starts_at, zoneIata)} ${formatAirportTimeWithZone(stay.starts_at, zoneIata)}`;
    const end = `${formatAirportDate(stay.ends_at, zoneIata)} ${formatAirportTimeWithZone(stay.ends_at, zoneIata)}`;
    return `${stay.city} · ${start} – ${end}`;
  }
  const flight = tripFlight(trip);
  if (flight) {
    return `${formatAirportDate(flight.scheduled_departure, flight.departure_airport)} ${formatAirportTimeWithZone(flight.scheduled_departure, flight.departure_airport)}`;
  }
  return null;
}

export function matchReasonLabel(
  match: TripMatchEntry,
  t: (key: string, options?: Record<string, string>) => string,
): string {
  if (match.match_type === 'same_flight') return t('trips.matchSameFlight');
  if (match.match_type === 'same_route') return t('trips.matchSameRoute');
  return t('trips.matchLayover', { city: match.city ?? t('home.crewMember') });
}
