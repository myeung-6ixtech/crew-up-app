import type { ApolloClient } from '@apollo/client';
import { GET_ACTIVITIES } from '@/graphql/queries/activities';
import type { Activity } from '@/types/domain';

export async function fetchActivities(client: ApolloClient): Promise<Activity[]> {
  const { data } = await client.query({
    query: GET_ACTIVITIES,
    fetchPolicy: 'cache-first',
  });
  return (data as { activities?: Activity[] })?.activities ?? [];
}
