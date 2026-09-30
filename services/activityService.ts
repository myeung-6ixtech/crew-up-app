import type { ApolloClient } from '@apollo/client';
import {
  DELETE_ACTIVITY_PREFERENCES,
  GET_ACTIVITIES,
  GET_ACTIVITY_PREFERENCES,
  INSERT_ACTIVITY_PREFERENCES,
} from '@/graphql/queries/activities';
import type { Activity, ActivityKind, ActivityPreference } from '@/types/domain';

export async function fetchActivities(client: ApolloClient): Promise<Activity[]> {
  const { data } = await client.query({
    query: GET_ACTIVITIES,
    fetchPolicy: 'network-only',
  });
  return (data as { activities?: Activity[] })?.activities ?? [];
}

function asKind(value: string | null | undefined): ActivityKind {
  return value === 'interest' ? 'interest' : 'activity';
}

export async function fetchActivityPreferences(
  client: ApolloClient,
  userId: string,
): Promise<ActivityPreference[]> {
  const { data } = await client.query({
    query: GET_ACTIVITY_PREFERENCES,
    variables: { userId },
    fetchPolicy: 'network-only',
  });
  const rows =
    (data as {
      profile_activity_preferences?: Array<{
        activity_id: string;
        activity: { id: string; name: string; kind?: string | null } | null;
      }>;
    })?.profile_activity_preferences ?? [];
  return rows.flatMap((row) =>
    row.activity
      ? [{ activityId: row.activity.id, name: row.activity.name, kind: asKind(row.activity.kind) }]
      : [],
  );
}

/** Replaces the signed-in member's activity and interest tags. */
export async function replaceActivityPreferences(
  client: ApolloClient,
  userId: string,
  activityIds: string[],
): Promise<void> {
  await client.mutate({
    mutation: DELETE_ACTIVITY_PREFERENCES,
    variables: { userId },
  });
  if (!activityIds.length) return;
  await client.mutate({
    mutation: INSERT_ACTIVITY_PREFERENCES,
    variables: { objects: activityIds.map((activity_id) => ({ activity_id })) },
  });
}
