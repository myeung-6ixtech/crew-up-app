import type { ApolloClient } from '@apollo/client';
import { PARSE_ROSTER, SUBMIT_REPORT } from '@/graphql/mutations/actions';
import type { ParsedRosterEntry } from '@/types/domain';

export async function parseRoster(
  client: ApolloClient,
  fileId: string,
) {
  const { data } = await client.mutate<{
    parseRoster: { sourceFileId: string; entries: ParsedRosterEntry[] };
  }>({
    mutation: PARSE_ROSTER,
    variables: { fileId },
  });
  return (data as any)?.parseRoster;
}

export async function submitReport(
  client: ApolloClient,
  input: {
    reason: string;
    details?: string;
    reportedUserId?: string;
    reportedMessageId?: string;
    reportedEventId?: string;
  },
) {
  const { data } = await client.mutate<{
    submitReport: { reportId: string; status: string };
  }>({
    mutation: SUBMIT_REPORT,
    variables: input,
  });
  return (data as any)?.submitReport;
}
