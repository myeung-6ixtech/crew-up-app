import { VISIBILITY_LEVELS, type VisibilityLevel } from '@/constants/screens';

/** Visibility options available for the current affiliation (airline optional). */
export function visibilityLevelsForAffiliation(
  airlineId?: string | null,
  { includeOff = false }: { includeOff?: boolean } = {},
): VisibilityLevel[] {
  return VISIBILITY_LEVELS.filter((level) => {
    if (!includeOff && level === 'off') return false;
    if (level === 'same_airline' && !airlineId) return false;
    return true;
  });
}

/** Coerce invalid same-airline visibility when affiliation is cleared. */
export function normalizeVisibilityForAffiliation(
  visibility: VisibilityLevel,
  airlineId?: string | null,
): VisibilityLevel {
  if (visibility === 'same_airline' && !airlineId) return 'friends';
  return visibility;
}
