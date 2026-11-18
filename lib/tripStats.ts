import { stayCity } from '@/components/roster/TripCard';
import { upcomingLayovers } from '@/lib/layovers';
import type { TripEntry } from '@/types/trip';

/**
 * The Trips and Cities counts on Home and Profile: upcoming trips (the same rule as Your trips) and the cities of
 * upcoming layovers (the same list as Your trips › Layovers), so all three screens agree.
 */
export function tripStats(trips: TripEntry[], nowMs: number = Date.now()) {
  const upcoming = trips.filter((trip) =>
    trip.ends_at ? Date.parse(trip.ends_at) >= nowMs : trip.starts_at ? Date.parse(trip.starts_at) >= nowMs : false,
  ).length;
  const cities = new Set(
    upcomingLayovers(trips, { nowMs, cityFor: (city, iata) => stayCity({ city: city ?? iata ?? '', airport_iata: iata }) }).map((layover) => layover.city),
  ).size;
  return { upcoming, cities };
}
