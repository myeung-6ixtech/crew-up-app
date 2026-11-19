import type { ApolloClient } from '@apollo/client';
import { callClientFunction } from '@/lib/api/functions';
import { submitReport } from '@/services/actionService';
import { blockUser, fetchBlocks } from '@/services/connectionService';

export async function reportUser(
  client: ApolloClient,
  input: {
    reason: string;
    details?: string;
    reportedUserId?: string;
    reportedMessageId?: string;
    reportedEventId?: string;
    context?: Record<string, unknown>;
  },
) {
  return submitReport(client, input);
}

/** Block someone (idempotent). Also ends any friendship and cancels pending requests both ways. */
export async function blockPerson(userId: string, reason?: string) {
  await callClientFunction<{ blocked: true }>('blocks/create', { body: { user_id: userId, reason } });
}

/** End a friendship (idempotent). They aren't notified; the direct chat closes. */
export async function unfriendPerson(userId: string) {
  await callClientFunction<{ unfriended: true }>('friends/unfriend', { body: { user_id: userId } });
}

export async function reportAndBlock(
  client: ApolloClient,
  reportedUserId: string,
  reason: string,
  details?: string,
) {
  const report = await submitReport(client, { reason, details, reportedUserId });
  await blockUser(client, reportedUserId);
  return report;
}

export { fetchBlocks, blockUser };
