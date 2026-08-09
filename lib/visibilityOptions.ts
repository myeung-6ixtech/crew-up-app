import { VISIBILITY_LEVELS, type VisibilityLevel } from '@/constants/screens';
import { hasAirlineAffiliation } from '@/lib/airlineClaim';

/** Visibility options available for the current affiliation (airline optional). */
export function visibilityLevelsForAffiliation(
  airlineId?: string | null,
  { includeOff = false }: { includeOff?: boolean } = {},
): VisibilityLevel[] {
  return VISIBILITY_LEVELS.filter((level) => {
    if (!includeOff && level === 'off') return false;
    if (level === 'same_airline' && !hasAirlineAffiliation(airlineId)) return false;
    return true;
  });
}

/** Coerce invalid same-airline visibility when affiliation is cleared. */
export function normalizeVisibilityForAffiliation(
  visibility: VisibilityLevel,
  airlineId?: string | null,
): VisibilityLevel {
  if (visibility === 'same_airline' && !hasAirlineAffiliation(airlineId)) return 'friends';
  return visibility;
}

/** Coerce invalid same-airline event scope when affiliation is cleared. */
export function normalizeEventVisibilityScope(
  scope: string,
  airlineId?: string | null,
): string {
  if (scope === 'same_airline' && !hasAirlineAffiliation(airlineId)) return 'all_verified';
  return scope;
}
