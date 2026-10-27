import type { ApolloClient } from '@apollo/client';
import { callClientFunction } from '@/lib/api/functions';
import type { MessageItem } from '@/types/domain';
import {
  GET_MY_THREADS,
  GET_THREAD_MESSAGES,
  INSERT_MESSAGE,
  MESSAGES_SUBSCRIPTION,
  UPDATE_LAST_READ,
} from '@/graphql/mutations/messaging';

export async function fetchThreads(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query({
    query: GET_MY_THREADS,
    variables: { userId },
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

export async function markThreadRead(
  client: ApolloClient,
  participantId: string,
) {
  await client.mutate({
    mutation: UPDATE_LAST_READ,
    variables: { id: participantId, lastReadAt: new Date().toISOString() },
  });
}

/** Opens the direct thread with a friend. The function adds both people; the app cannot. */
export async function ensureDirectThread(otherUserId: string) {
  const result = await callClientFunction<{ thread_id: string }>('threads/direct', {
    body: { user_id: otherUserId },
  });
  return result.thread_id;
}

export { MESSAGES_SUBSCRIPTION };
