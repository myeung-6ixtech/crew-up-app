import { nhost } from '@/lib/nhost';
import { secureStoreSession } from '@/lib/secureStoreSession';

const HASURA_CLAIMS_NAMESPACE = 'https://hasura.io/jwt/claims';

/** Matches crew-up-nhost auth custom claim default for users without an airline. */
export const NO_AIRLINE_CLAIM = '00000000-0000-0000-0000-000000000000';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = globalThis.atob(normalized);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getHasuraClaim(token: string, claim: string): string | null {
  const payload = decodeJwtPayload(token);
  const claims = payload?.[HASURA_CLAIMS_NAMESPACE];
  if (!claims || typeof claims !== 'object') return null;
  const value = (claims as Record<string, unknown>)[claim];
  return typeof value === 'string' ? value : null;
}

/** Load persisted session and refresh the access token before GraphQL calls. */
export async function ensureAccessToken(): Promise<string | null> {
  await secureStoreSession.getAsync();
  const session = await nhost.refreshSession(60);
  return session?.accessToken ?? nhost.getUserSession()?.accessToken ?? null;
}

/**
 * Refresh the session so JWT custom claims (e.g. x-hasura-airline-id) match the database.
 * Call after creating or updating profile fields that map to Hasura session variables.
 */
export async function refreshSessionClaims(): Promise<void> {
  await secureStoreSession.getAsync();
  await nhost.refreshSession(0);
}
