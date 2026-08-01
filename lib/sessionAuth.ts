import { nhost } from '@/lib/nhost';
import { secureStoreSession } from '@/lib/secureStoreSession';

/** Load persisted session and refresh the access token before GraphQL calls. */
export async function ensureAccessToken(): Promise<string | null> {
  await secureStoreSession.getAsync();
  const session = await nhost.refreshSession(60);
  return session?.accessToken ?? nhost.getUserSession()?.accessToken ?? null;
}

/**
 * Refresh the session so JWT custom claims (e.g. x-hasura-is-verified) match the database.
 * Call after profile changes that affect Hasura session variables.
 */
export async function refreshSessionClaims(): Promise<void> {
  await secureStoreSession.getAsync();
  await nhost.refreshSession(0);
}
