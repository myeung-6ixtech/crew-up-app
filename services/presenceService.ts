import type { ApolloClient } from '@apollo/client';
import { GET_HOME_DATA, GET_PRESENCE_BY_CITY } from '@/graphql/queries/home';

export async function fetchHomeData(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query({
    query: GET_HOME_DATA,
    variables: { userId, now: new Date().toISOString() },
    fetchPolicy: 'network-only',
  });
  return data;
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
