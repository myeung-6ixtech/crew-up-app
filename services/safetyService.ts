import type { ApolloClient } from '@apollo/client';
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
  },
) {
  return submitReport(client, input);
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
