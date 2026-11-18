import type { ApolloClient } from '@apollo/client';
import { GET_HOME_DATA, GET_PRESENCE_BY_CITY, GET_UPCOMING_TRIPS, UPCOMING_TRIPS_PAGE } from '@/graphql/queries/home';
import type { TripEntry } from '@/types/trip';

/** Home data with the first page of upcoming trips. `now` is returned so later pages use the same cut-off. */
export async function fetchHomeData(
  client: ApolloClient,
  userId: string,
  now: string = new Date().toISOString(),
  /** How many upcoming trips to return; a refresh asks for as many as are already on screen. */
  upcomingLimit: number = UPCOMING_TRIPS_PAGE,
) {
  const { data } = await client.query({
    query: GET_HOME_DATA,
    variables: { userId, now, upcomingLimit, upcomingOffset: 0 },
    fetchPolicy: 'network-only',
  });
  return data;
}

/** The next page of What's next, after `offset` trips. */
export async function fetchUpcomingTrips(client: ApolloClient, userId: string, now: string, offset: number) {
  const { data } = await client.query({
    query: GET_UPCOMING_TRIPS,
    variables: { userId, now, upcomingLimit: UPCOMING_TRIPS_PAGE, upcomingOffset: offset },
    fetchPolicy: 'network-only',
  });
  return ((data as { upcomingTrips?: unknown[] } | undefined)?.upcomingTrips ?? []) as TripEntry[];
}

export async function fetchPresenceByCity(
  client: ApolloClient,
  city: string,
) {
  const { data } = await client.query({
    query: GET_PRESENCE_BY_CITY,
    variables: { city },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.presence ?? [];
}
