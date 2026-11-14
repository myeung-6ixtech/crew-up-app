import type { ApolloClient } from '@apollo/client';
import { callClientFunction } from '@/lib/api/functions';
import type { MessageItem } from '@/types/domain';
import {
  DIRECT_MESSAGE_WAKE,
  GET_MY_THREADS,
  GET_THREAD_MESSAGES,
  INSERT_MESSAGE,
  MESSAGES_SUBSCRIPTION,
  UNREAD_DIRECT,
  UPDATE_LAST_READ,
} from '@/graphql/mutations/messaging';

export async function fetchThreads(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query({
    query: GET_MY_THREADS,
    variables: { userId },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.thread_participants ?? [];
}

export const MESSAGE_PAGE_SIZE = 40;
const LATEST_BEFORE = '9999-01-01T00:00:00.000Z';

/** One page, oldest first. Pass `before` (a created_at) to load the previous page. */
export async function fetchMessages(
  client: ApolloClient,
  threadId: string,
  before?: string,
): Promise<{ messages: MessageItem[]; hasMore: boolean }> {
  const { data } = await client.query({
    query: GET_THREAD_MESSAGES,
    variables: { threadId, before: before ?? LATEST_BEFORE, limit: MESSAGE_PAGE_SIZE },
    fetchPolicy: 'network-only',
  });
  const rows = ((data as { messages?: MessageItem[] } | undefined)?.messages ?? []).slice();
  return { messages: rows.reverse(), hasMore: rows.length === MESSAGE_PAGE_SIZE };
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

export { MESSAGES_SUBSCRIPTION };
