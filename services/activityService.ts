import type { ApolloClient } from '@apollo/client';
import { selectableIds } from '@crewup/shared';
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
        activity: { id: string; slug?: string | null; name: string; kind?: string | null; icon?: string | null } | null;
      }>;
    })?.profile_activity_preferences ?? [];
  return rows.flatMap((row) =>
    row.activity
      ? [
          {
            activityId: row.activity.id,
            slug: row.activity.slug ?? null,
            name: row.activity.name,
            kind: asKind(row.activity.kind),
            icon: row.activity.icon ?? null,
          },
        ]
      : [],
  );
}

/**
 * Replaces the signed-in member's activity and interest tags. Only child rows are kept: a parent group (or a stale
 * id) never reaches the API. The database rejects a parent too (profile_activity_preferences_not_group).
 */
export async function replaceActivityPreferences(
  client: ApolloClient,
  userId: string,
  ids: string[],
  catalogue?: Activity[],
): Promise<void> {
  const activityIds = selectableIds(catalogue ?? (await fetchActivities(client)), ids);
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
