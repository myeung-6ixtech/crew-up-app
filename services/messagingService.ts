import type { ApolloClient } from '@apollo/client';
import {
  GET_MY_THREADS,
  GET_THREAD_MESSAGES,
  INSERT_DIRECT_THREAD,
  INSERT_MESSAGE,
  INSERT_THREAD_PARTICIPANT,
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

export async function fetchMessages(
  client: ApolloClient,
  threadId: string,
) {
  const { data } = await client.query({
    query: GET_THREAD_MESSAGES,
    variables: { threadId },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.messages ?? [];
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

export async function ensureDirectThread(
  client: ApolloClient,
  userId: string,
  otherUserId: string,
) {
  const participants = await fetchThreads(client, userId);
  const existing = participants.find(
    (p: { thread: { type: string; participants: { user_id: string }[] } }) =>
      p.thread.type === 'direct' &&
      p.thread.participants.some((x) => x.user_id === otherUserId),
  );
  if (existing) return existing.thread_id as string;

  const { data } = await client.mutate({
    mutation: INSERT_DIRECT_THREAD,
    variables: {
      thread: {
        type: 'direct',
        participants: { data: [{ user_id: userId }] },
      },
    },
  });
  const threadId = (data as any)?.insert_threads_one?.id as string;
  return threadId;
}

export { MESSAGES_SUBSCRIPTION };
