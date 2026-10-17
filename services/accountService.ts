import { gql, type ApolloClient } from '@apollo/client';
import { callClientFunction } from '@/lib/api/functions';

export const DELETE_CONFIRM_WORD = 'DELETE';

export const GET_MY_PENDING_DELETION = gql`
  query GetMyPendingDeletion($userId: uuid!) {
    account_deletions_by_pk(user_id: $userId) {
      purge_after
      cancelled_at
      purged_at
    }
  }
`;

export type PendingDeletion = { purgeAfter: string };

export function formatDeletionDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** The account's scheduled deletion, or null when there is none (or it was cancelled). */
export async function fetchPendingDeletion(client: ApolloClient, userId: string): Promise<PendingDeletion | null> {
  const { data } = await client.query<{
    account_deletions_by_pk: { purge_after: string; cancelled_at: string | null; purged_at: string | null } | null;
  }>({ query: GET_MY_PENDING_DELETION, variables: { userId }, fetchPolicy: 'network-only' });
  const row = data?.account_deletions_by_pk;
  return row && !row.cancelled_at && !row.purged_at ? { purgeAfter: row.purge_after } : null;
}

export function fetchDeletionInfo() {
  return callClientFunction<{ requiresPassword: boolean; graceDays: number; pending: PendingDeletion | null }>('account/delete', {
    method: 'GET',
  });
}

/** Schedules deletion and signs out every session. Throws FunctionError (ACCOUNT_DELETE_BAD_PASSWORD, …). */
export function requestAccountDeletion(password?: string) {
  return callClientFunction<{ purgeAfter: string }>('account/delete', {
    body: { confirm: DELETE_CONFIRM_WORD, ...(password ? { password } : {}) },
  });
}

export function restoreAccount() {
  return callClientFunction<{ restored: boolean }>('account/restore');
}
