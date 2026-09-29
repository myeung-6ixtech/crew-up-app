import { ProfileCompleteSchema, type StepInput } from '@crewup/shared';
import type { Profile } from '@/types/domain';

type CompleteInput = StepInput<'name_handle'> & StepInput<'about'> & StepInput<'residence'> & StepInput<'crew'>;

/** Profile row → the camelCase shape validated by `ProfileCompleteSchema`. */
export function profileToCompleteInput(profile: Profile | null | undefined): CompleteInput {
  return {
    fullName: profile?.full_name ?? '',
    fullNameNative: profile?.full_name_native ?? null,
    preferredName: profile?.preferred_name ?? null,
    username: profile?.username ?? '',
    dateOfBirth: profile?.own_date_of_birth ?? '',
    homeCountryCode: profile?.home_country_code ?? '',
    hometownCity: profile?.hometown_city ?? null,
    languages: profile?.languages ?? [],
    residenceCountryCode: profile?.residence_country_code ?? '',
    residenceCity: profile?.residence_city ?? '',
    crewRole: profile?.crew_role ?? ('' as CompleteInput['crewRole']),
    airlineId: profile?.airline_id ?? '',
    baseAirportIata: profile?.base_airport_iata ?? '',
  };
}

/** Field names that are still missing/invalid, used to flag sections on Review. */
export function incompleteFields(profile: Profile | null | undefined): Set<string> {
  const result = ProfileCompleteSchema.safeParse(profileToCompleteInput(profile));
  return new Set(result.success ? [] : result.error.issues.map((issue) => String(issue.path[0])));
}
