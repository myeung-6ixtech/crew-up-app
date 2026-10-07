import type { ApolloClient } from '@apollo/client';
import { PARSE_ROSTER, SUBMIT_REPORT } from '@/graphql/mutations/actions';
import type { ParsedRosterEntry, ParsedRosterTrip } from '@/types/domain';

export interface ParsedRosterResult {
  sourceFileId: string;
  entries: ParsedRosterEntry[];
  homeBase?: string | null;
  /** Null from function builds that predate trip grouping. */
  trips?: ParsedRosterTrip[] | null;
  skippedDuties?: number | null;
}

export async function parseRoster(
  client: ApolloClient,
  fileId: string,
): Promise<ParsedRosterResult | undefined> {
  const { data } = await client.mutate<{
    parseRoster: ParsedRosterResult;
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
