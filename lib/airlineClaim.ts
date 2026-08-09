/**
 * JWT `x-hasura-airline-id` sentinel when `profiles.airline_id` is null.
 * Must stay in sync with `crew-up-nhost/nhost/nhost.toml` customClaims default.
 */
export const AIRLINE_CLAIM_SENTINEL = '00000000-0000-0000-0000-000000000000';

/** True when the user has a real airline affiliation (not the JWT sentinel). */
export function hasAirlineAffiliation(airlineId?: string | null): boolean {
  return Boolean(airlineId);
}
