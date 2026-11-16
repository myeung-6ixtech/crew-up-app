import type { ApolloClient } from '@apollo/client';
import * as Crypto from 'expo-crypto';
import { runRosterRead, type RosterReadEvent } from '@/lib/rosterRead';
import { callClientFunction } from '@/lib/api/functions';
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

/**
 * Reads a roster with retries (lib/rosterRead.ts). The function deletes the uploaded file after every attempt, so
 * each attempt uploads the same local file again; nothing is kept on the server between tries. Parsing saves nothing,
 * so a retry can't create duplicate trips; trips are only written from the confirm screen.
 */
export async function readRosterWithRetries(
  client: ApolloClient,
  params: { uri: string; name: string; mimeType: string },
  options: {
    signal: AbortSignal;
    /** Called when an attempt's upload finishes and reading starts. */
    onUploaded?: () => void;
    onEvent?: (event: RosterReadEvent) => void;
  },
) {
  const readId = Crypto.randomUUID();
  return runRosterRead({
    signal: options.signal,
    onEvent: (event) => {
      // Status codes, retries and timings are for logs only, never for the screen.
      if (event.type !== 'attempt') console.info('[roster-read]', JSON.stringify({ readId, ...event }));
      options.onEvent?.(event);
    },
    attempt: async (attempt, signal, elapsedMs) => {
      const fileId = await uploadFile({
        uri: params.uri,
        name: params.name,
        mimeType: params.mimeType,
        bucketId: STORAGE_BUCKETS.rosters,
        signal,
      });
      options.onUploaded?.();
      const parsed = await parseRoster(client, fileId, { signal, read: { id: readId, attempt, elapsedMs } });
      return { fileId, parsed };
    },
  });
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

export type RosterConsentInfo = { enabled: boolean; providerName: string; version: string; consented: boolean };

/** Whether roster AI reading is on, which provider the consent screen names, and whether the user agreed to it. */
export function fetchRosterConsent() {
  return callClientFunction<RosterConsentInfo>('roster/consent', { method: 'GET' });
}

export function acceptRosterConsent(version: string) {
  return callClientFunction<{ consented: true; version: string }>('roster/consent', { body: { version } });
}
