import type { ApolloClient } from '@apollo/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';
import {
  DISCOVER_PROFILES,
  GET_BLOCKS,
  GET_CONNECTIONS,
  GET_MY_FRIEND_ID,
  GET_PUBLIC_PROFILE,
  INSERT_BLOCK,
  UPDATE_CONNECTION,
} from '@/graphql/queries/network';

export type FriendProfilePreview = {
  user_id: string;
  display_name: string;
  role_type?: string | null;
  base_airport?: string | null;
  avatar_file_id?: string | null;
  friend_id: string;
  friend_id_display?: string;
};

export type ConnectionRequestResult = {
  connection: { id: string; status: string };
  outcome: 'created' | 'already_sent' | 'accepted' | 'already_friends';
};

export class ConnectionRequestError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ConnectionRequestError';
    this.code = code;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await nhost.refreshSession(60);
  if (!session?.accessToken) {
    throw new Error('Not authenticated');
  }
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  };
}

function mapRequestError(payload: { error?: { code?: string; message?: string }; message?: string }): never {
  const code = payload.error?.code ?? 'REQUEST_FAILED';
  const message = payload.error?.message ?? payload.message ?? 'Failed to send connection request';
  throw new ConnectionRequestError(code, message);
}

export async function fetchMyFriendId(client: ApolloClient, userId: string): Promise<string | null> {
  const { data } = await client.query({
    query: GET_MY_FRIEND_ID,
    variables: { userId },
    fetchPolicy: 'network-only',
  });
  return (data as { profiles_by_pk?: { friend_id?: string | null } | null })?.profiles_by_pk?.friend_id ?? null;
}

export async function lookupByFriendId(friendId: string): Promise<FriendProfilePreview> {
  const headers = await authHeaders();
  const response = await fetch(`${apiEndpoints.functions}/client/friends/lookup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ friend_id: friendId }),
  });

  const payload = (await response.json()) as {
    profile?: FriendProfilePreview;
    error?: { code?: string; message?: string };
    message?: string;
  };

  if (!response.ok) {
    mapRequestError(payload);
  }

  if (!payload.profile) {
    throw new ConnectionRequestError('NOT_FOUND', 'No crew member found with that Crew ID');
  }

  return payload.profile;
}

async function postConnectionRequest(body: {
  addressee_id?: string;
  friend_id?: string;
  message?: string;
}): Promise<ConnectionRequestResult> {
  const headers = await authHeaders();
  const response = await fetch(`${apiEndpoints.functions}/client/friends/request`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ConnectionRequestResult & {
    error?: { code?: string; message?: string };
    message?: string;
  };

  if (!response.ok) {
    mapRequestError(payload);
  }

  if (!payload.connection) {
    throw new ConnectionRequestError('REQUEST_FAILED', 'Failed to send connection request');
  }

  return {
    connection: payload.connection,
    outcome: payload.outcome,
  };
}

export async function requestConnection(
  _client: ApolloClient,
  addresseeId: string,
  message?: string,
): Promise<ConnectionRequestResult['connection']> {
  const result = await postConnectionRequest({ addressee_id: addresseeId, message });
  return result.connection;
}

export async function requestConnectionByFriendId(
  friendId: string,
  message?: string,
): Promise<ConnectionRequestResult> {
  return postConnectionRequest({ friend_id: friendId, message });
}

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

export type SuggestedProfile = {
  user_id: string;
  display_name: string;
  role_type?: string | null;
  base_airport?: string | null;
  avatar_file_id?: string | null;
};

export async function fetchSuggestedFriends(
  client: ApolloClient,
  userId: string,
  baseAirport?: string | null,
  limit = 12,
): Promise<SuggestedProfile[]> {
  const [connections, blocks] = await Promise.all([
    fetchConnections(client, userId),
    fetchBlocks(client, userId),
  ]);

  const connectedIds = connections.flatMap((connection: { requester_id: string; addressee_id: string }) => [
    connection.requester_id,
    connection.addressee_id,
  ]);
  const blockedIds = blocks.map((block: { blocked_id: string }) => block.blocked_id);
  const excludeUserIds = [...new Set([userId, ...connectedIds, ...blockedIds])];

  const sameBase = baseAirport
    ? await discoverProfiles(client, {
        baseAirport,
        excludeUserIds,
        limit,
      })
    : [];

  const remainingExclude = [...excludeUserIds, ...sameBase.map((profile: SuggestedProfile) => profile.user_id)];
  const others =
    sameBase.length < limit
      ? await discoverProfiles(client, {
          excludeUserIds: remainingExclude,
          limit: limit - sameBase.length,
        })
      : [];

  return [...sameBase, ...others].slice(0, limit);
}

/** Verified crew on the platform, excluding self, connections, and blocks. */
export async function fetchDiscoverableUsers(
  client: ApolloClient,
  userId: string,
  limit = 24,
): Promise<SuggestedProfile[]> {
  const [connections, blocks] = await Promise.all([
    fetchConnections(client, userId),
    fetchBlocks(client, userId),
  ]);

  const connectedIds = connections.flatMap((connection: { requester_id: string; addressee_id: string }) => [
    connection.requester_id,
    connection.addressee_id,
  ]);
  const blockedIds = blocks.map((block: { blocked_id: string }) => block.blocked_id);
  const excludeUserIds = [...new Set([userId, ...connectedIds, ...blockedIds])];

  return discoverProfiles(client, {
    excludeUserIds,
    limit,
  });
}
