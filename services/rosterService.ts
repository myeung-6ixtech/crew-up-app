import type { ApolloClient } from '@apollo/client';
import { parseRoster } from '@/services/actionService';
import { STORAGE_BUCKETS } from '@/constants/storage';
import { uploadFile } from '@/services/uploadService';
import {
  DELETE_ROSTER,
  GET_MY_ROSTERS,
  INSERT_ROSTERS,
  UPDATE_ROSTER,
} from '@/graphql/mutations/roster';
import type { ParsedRosterEntry, RosterEntry } from '@/types/domain';

export async function uploadAndParseRoster(
  client: ApolloClient,
  params: { uri: string; name: string; mimeType: string },
) {
  const fileId = await uploadFile({
    uri: params.uri,
    name: params.name,
    mimeType: params.mimeType,
    bucketId: STORAGE_BUCKETS.rosters,
  });
  const parsed = await parseRoster(client, fileId);
  return { fileId, parsed };
}

export function mapParsedToRosterInsert(
  entries: ParsedRosterEntry[],
  sourceFileId?: string,
) {
  return entries.map((entry) => ({
    flight_number: entry.flightNumber,
    departure_airport: entry.departureAirport,
    arrival_airport: entry.arrivalAirport,
    layover_city: entry.layoverCity,
    layover_start: entry.layoverStart,
    layover_end: entry.layoverEnd,
    source: sourceFileId ? 'upload' : 'manual',
    source_file_id: sourceFileId,
  }));
}

export async function insertRosters(
  client: ApolloClient,
  objects: Record<string, unknown>[],
) {
  const { data } = await client.mutate({
    mutation: INSERT_ROSTERS,
    variables: { objects },
  });
  return (data as any)?.insert_rosters;
}

export async function fetchMyRosters(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query<{ rosters: RosterEntry[] }>({
    query: GET_MY_ROSTERS,
    variables: { userId },
  });
  return (data as any)?.rosters ?? [];
}

export async function deleteRoster(
  client: ApolloClient,
  id: string,
) {
  await client.mutate({ mutation: DELETE_ROSTER, variables: { id } });
}

export async function updateRosterEntry(
  client: ApolloClient,
  id: string,
  set: Partial<RosterEntry>,
) {
  await client.mutate({ mutation: UPDATE_ROSTER, variables: { id, set } });
}
