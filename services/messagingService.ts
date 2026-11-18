import type { ApolloClient } from '@apollo/client';
import { callClientFunction } from '@/lib/api/functions';
import type { MessageItem } from '@/types/domain';
import type { WaveMeta } from '@/components/discover/wave';
import {
  DIRECT_MESSAGE_WAKE,
  GET_DIRECT_COUNTERPARTS,
  GET_MY_THREADS,
  GET_MY_THREADS_PLAIN,
  GET_MY_WAVES,
  GET_THREAD_MESSAGES,
  GET_THREAD_MESSAGES_PLAIN,
  INSERT_MESSAGE,
  MESSAGES_SUBSCRIPTION,
  MESSAGES_SUBSCRIPTION_PLAIN,
  UNREAD_DIRECT,
  UPDATE_LAST_READ,
} from '@/graphql/mutations/messaging';

/** Null until a messages query learns whether this server has wave columns. */
let waveColumns: boolean | null = null;

/** False once the server has reported that messages.kind does not exist yet. */
export function messageWaveColumns(): boolean {
  return waveColumns !== false;
}

function missingWaveColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  let extra = '';
  try {
    extra = JSON.stringify(error);
  } catch {
    extra = '';
  }
  const text = `${message} ${extra}`;
  return text.includes("field 'kind'") || text.includes('field "kind"') || text.includes("field 'meta'");
}

async function queryEither(
  client: ApolloClient,
  full: typeof GET_MY_THREADS,
  plain: typeof GET_MY_THREADS,
  variables: Record<string, unknown>,
) {
  const run = (query: typeof GET_MY_THREADS) =>
    client.query({ query, variables, fetchPolicy: 'network-only' });
  if (waveColumns === false) return run(plain);
  try {
    const result = await run(full);
    waveColumns = true;
    return result;
  } catch (error) {
    if (!missingWaveColumn(error)) throw error;
    waveColumns = false;
    return run(plain);
  }
}

export async function fetchThreads(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await queryEither(client, GET_MY_THREADS, GET_MY_THREADS_PLAIN, { userId });
  return (data as any)?.thread_participants ?? [];
}

export type DirectCounterpart = {
  thread_id: string;
  user_id: string;
  profile?: {
    display_name?: string | null;
    preferred_name?: string | null;
    full_name?: string | null;
    avatar_file_id?: string | null;
    crew_role?: string | null;
    role_type?: string | null;
    base_airport?: string | null;
    base_airport_iata?: string | null;
  } | null;
};

/** Who a direct thread is with. Includes chats this user opened by sending the first message. */
export async function fetchDirectCounterparts(
  client: ApolloClient,
  userId: string,
  threadIds: string[],
): Promise<DirectCounterpart[]> {
  if (!threadIds.length) return [];
  const { data } = await client.query({
    query: GET_DIRECT_COUNTERPARTS,
    variables: { userId, threadIds },
    fetchPolicy: 'network-only',
  });
  const rows =
    (data as {
      thread_participants?: Array<{
        thread_id: string;
        user_id: string;
        user?: { profile?: DirectCounterpart['profile'] } | null;
      }>;
    })?.thread_participants ?? [];
  return rows.map((row) => ({ thread_id: row.thread_id, user_id: row.user_id, profile: row.user?.profile ?? null }));
}

export const MESSAGE_PAGE_SIZE = 40;
const LATEST_BEFORE = '9999-01-01T00:00:00.000Z';

/** One page, oldest first. Pass `before` (a created_at) to load the previous page. */
export async function fetchMessages(
  client: ApolloClient,
  threadId: string,
  before?: string,
): Promise<{ messages: MessageItem[]; hasMore: boolean }> {
  const { data } = await queryEither(client, GET_THREAD_MESSAGES, GET_THREAD_MESSAGES_PLAIN, {
    threadId,
    before: before ?? LATEST_BEFORE,
    limit: MESSAGE_PAGE_SIZE,
  });
  const rows = ((data as { messages?: MessageItem[] } | undefined)?.messages ?? []).slice();
  return { messages: rows.reverse(), hasMore: rows.length === MESSAGE_PAGE_SIZE };
}

function errorBlob(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  try {
    return `${message} ${JSON.stringify(error)}`;
  } catch {
    return message;
  }
}

function isDuplicateWave(error: unknown): boolean {
  const text = errorBlob(error);
  return text.includes('messages_wave_overlap_unique') || text.includes('Uniqueness violation');
}

/** One layover nudge in a direct thread. A repeat of the same overlap is already sent. */
export async function sendWave(client: ApolloClient, threadId: string, meta: WaveMeta) {
  try {
    const { data } = await client.mutate({
      mutation: INSERT_MESSAGE,
      variables: { object: { thread_id: threadId, body: 'Poked', kind: 'wave', meta } },
    });
    return (data as { insert_messages_one?: { id: string } } | undefined)?.insert_messages_one ?? null;
  } catch (error) {
    if (isDuplicateWave(error)) return null;
    throw error;
  }
}

export type SentWave = {
  overlap_key: string;
  other_id: string;
};

/** Waves this user already posted, so the layover button can read Waved. */
export async function fetchMyWaves(client: ApolloClient, userId: string): Promise<SentWave[]> {
  if (waveColumns === false) return [];
  let data: unknown;
  try {
    const result = await client.query({
      query: GET_MY_WAVES,
      variables: { userId },
      fetchPolicy: 'network-only',
    });
    waveColumns = true;
    data = result.data;
  } catch (error) {
    if (!missingWaveColumn(error)) throw error;
    waveColumns = false;
    return [];
  }
  const rows =
    (data as {
      messages?: Array<{
        meta?: { overlap_key?: string } | null;
        thread?: { participants?: { user_id: string }[] } | null;
      }>;
    })?.messages ?? [];
  return rows.flatMap((row) => {
    const overlap_key = row.meta?.overlap_key;
    const other_id = row.thread?.participants?.find((person) => person.user_id !== userId)?.user_id;
    if (!overlap_key || !other_id) return [];
    return [{ overlap_key, other_id }];
  });
}

/** Opens the direct thread and posts the layover wave. They must already be friends. */
export async function postLayoverNudge(client: ApolloClient, otherUserId: string, meta: WaveMeta) {
  const threadId = await ensureDirectThread(otherUserId);
  await sendWave(client, threadId, meta);
  return threadId;
}

export async function sendMessage(
  client: ApolloClient,
  threadId: string,
  body: string,
) {
  const { data } = await client.mutate({
    mutation: INSERT_MESSAGE,
    variables: { object: { thread_id: threadId, body } },
    optimisticResponse: {
      insert_messages_one: {
        __typename: 'messages',
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      },
    },
  });
  return (data as any)?.insert_messages_one;
}

const unreadRefreshers = new Set<() => void>();

/** The nav dot listens, because marking a thread read does not wake the message subscription. */
export function onDirectUnreadRefresh(listener: () => void) {
  unreadRefreshers.add(listener);
  return () => {
    unreadRefreshers.delete(listener);
  };
}

function refreshDirectUnread() {
  unreadRefreshers.forEach((listener) => listener());
}

export type DirectThreadUnread = {
  last_read_at?: string | null;
  thread: {
    participants?: { user_id: string }[];
    messages?: { sender_id?: string | null; created_at: string }[];
  };
};

/** A thread is unread when the newest message is from someone else and newer than last_read_at. */
export function isThreadUnread(
  row: { last_read_at?: string | null; thread: { messages?: { sender_id?: string | null; created_at?: string }[] } },
  userId: string,
): boolean {
  const latest = row.thread.messages?.[0];
  if (!latest?.created_at || !latest.sender_id || latest.sender_id === userId) return false;
  if (!row.last_read_at) return true;
  return Date.parse(latest.created_at) > Date.parse(row.last_read_at);
}

export function hasUnreadDirect(rows: DirectThreadUnread[], userId: string, blocked: Set<string>): boolean {
  return rows.some((row) => {
    const others = row.thread.participants?.filter((person) => person.user_id !== userId) ?? [];
    if (others.some((person) => blocked.has(person.user_id))) return false;
    return isThreadUnread(row, userId);
  });
}

export async function fetchUnreadDirect(client: ApolloClient, userId: string): Promise<DirectThreadUnread[]> {
  const { data } = await client.query({
    query: UNREAD_DIRECT,
    variables: { userId },
    fetchPolicy: 'network-only',
  });
  return (data as { thread_participants?: DirectThreadUnread[] } | undefined)?.thread_participants ?? [];
}

export async function markThreadRead(
  client: ApolloClient,
  participantId: string,
) {
  await client.mutate({
    mutation: UPDATE_LAST_READ,
    variables: { id: participantId, lastReadAt: new Date().toISOString() },
  });
  refreshDirectUnread();
}

export { DIRECT_MESSAGE_WAKE };

/** Opens the direct thread with a friend. The function adds both people; the app cannot. */
export async function ensureDirectThread(otherUserId: string) {
  const result = await callClientFunction<{ thread_id: string }>('threads/direct', {
    body: { user_id: otherUserId },
  });
  return result.thread_id;
}

export { MESSAGES_SUBSCRIPTION, MESSAGES_SUBSCRIPTION_PLAIN };
