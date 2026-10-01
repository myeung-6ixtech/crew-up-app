import type { TFunction } from 'i18next';

export type PersonProfile = {
  display_name?: string | null;
  preferred_name?: string | null;
  full_name?: string | null;
  role_type?: string | null;
  crew_role?: string | null;
  base_airport?: string | null;
  base_airport_iata?: string | null;
  avatar_file_id?: string | null;
};

export function personName(profile: PersonProfile | null | undefined, fallback = '') {
  return profile?.preferred_name || profile?.display_name || profile?.full_name || fallback;
}

/** "Cabin crew · DXB" — role label from onboarding, then base code. */
export function personRoleBase(profile: PersonProfile | null | undefined, t: TFunction) {
  const role = profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : profile?.role_type;
  return [role, profile?.base_airport_iata ?? profile?.base_airport].filter(Boolean).join(' · ');
}
