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

/** One read attempt. `read` ties attempts together in the function's logs; `signal` lets Cancel abort it. */
export async function parseRoster(
  client: ApolloClient,
  fileId: string,
  options: { signal?: AbortSignal; read?: { id: string; attempt: number; elapsedMs: number } } = {},
): Promise<ParsedRosterResult | undefined> {
  const { data } = await client.mutate<{
    parseRoster: ParsedRosterResult;
  }>({
    mutation: PARSE_ROSTER,
    variables: { fileId },
    context: {
      fetchOptions: options.signal ? { signal: options.signal } : undefined,
      headers: options.read
        ? {
            'x-crewup-read-id': options.read.id,
            'x-crewup-read-attempt': String(options.read.attempt),
            'x-crewup-read-elapsed-ms': String(Math.round(options.read.elapsedMs)),
          }
        : undefined,
    },
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
