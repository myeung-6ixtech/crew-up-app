import type { ApolloClient } from '@apollo/client';
import {
  DISCOVER_PROFILES,
  GET_BLOCKS,
  GET_CONNECTIONS,
  GET_PUBLIC_PROFILE,
  INSERT_BLOCK,
  INSERT_CONNECTION,
  UPDATE_CONNECTION,
} from '@/graphql/queries/network';

export async function fetchConnections(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query({
    query: GET_CONNECTIONS,
    variables: { userId },
  });
  return (data as any)?.connections ?? [];
}

export async function requestConnection(
  client: ApolloClient,
  addresseeId: string,
  message?: string,
) {
  const { data } = await client.mutate({
    mutation: INSERT_CONNECTION,
    variables: {
      object: { addressee_id: addresseeId, status: 'pending', message },
    },
  });
  return (data as any)?.insert_connections_one;
}

export async function updateConnectionStatus(
  client: ApolloClient,
  id: string,
  status: 'accepted',
) {
  const { data } = await client.mutate({
    mutation: UPDATE_CONNECTION,
    variables: { id, status },
  });
  return (data as any)?.update_connections_by_pk;
}

export async function discoverProfiles(
  client: ApolloClient,
  params: {
    airlineId?: string;
    baseAirport?: string;
    roleType?: string;
    limit?: number;
    offset?: number;
    excludeUserIds?: string[];
  },
) {
  const where: Record<string, unknown> = { is_verified: { _eq: true } };
  if (params.airlineId) where.airline_id = { _eq: params.airlineId };
  if (params.baseAirport) where.base_airport = { _eq: params.baseAirport };
  if (params.roleType) where.role_type = { _eq: params.roleType };
  if (params.excludeUserIds?.length) {
    where.user_id = { _nin: params.excludeUserIds };
  }

  const { data } = await client.query({
    query: DISCOVER_PROFILES,
    variables: {
      where,
      limit: params.limit ?? 30,
      offset: params.offset ?? 0,
    },
  });
  return (data as any)?.profiles ?? [];
}

export async function fetchPublicProfile(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query({
    query: GET_PUBLIC_PROFILE,
    variables: { userId },
  });
  return (data as any)?.profiles_by_pk;
}

export async function blockUser(
  client: ApolloClient,
  blockedId: string,
) {
  const { data } = await client.mutate({
    mutation: INSERT_BLOCK,
    variables: { object: { blocked_id: blockedId } },
  });
  return (data as any)?.insert_user_blocks_one;
}

export async function fetchBlocks(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query({
    query: GET_BLOCKS,
    variables: { userId },
  });
  return (data as any)?.user_blocks ?? [];
}
