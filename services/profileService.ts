import type { ApolloClient } from '@apollo/client';
import type { VisibilityLevel } from '@/constants/screens';
import {
  GET_AIRLINES,
  GET_MY_PROFILE,
  INSERT_PROFILE,
  INSERT_VERIFICATION,
  UPDATE_PROFILE,
  UPSERT_PROFILE,
} from '@/graphql/mutations/profile';
import { refreshSessionClaims } from '@/lib/sessionAuth';
import type { Profile } from '@/types/domain';

export async function fetchMyProfile(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query<{ profiles_by_pk: Profile | null }>({
    query: GET_MY_PROFILE,
    variables: { userId },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.profiles_by_pk ?? null;
}

export async function createProfile(
  client: ApolloClient,
  input: {
    display_name: string;
    airline_id?: string;
    base_airport?: string;
    role_type?: string;
    preferred_language?: string;
    default_visibility?: VisibilityLevel;
  },
) {
  const { data } = await client.mutate({
    mutation: INSERT_PROFILE,
    variables: { object: input },
  });
  await refreshSessionClaims();
  return (data as any)?.insert_profiles_one;
}

type ProfileInput = {
  display_name: string;
  airline_id?: string;
  base_airport?: string;
  role_type?: string;
  preferred_language?: string;
  default_visibility?: VisibilityLevel;
};

/** Create profile on first onboarding, or update if one already exists. */
export async function saveProfile(client: ApolloClient, input: ProfileInput) {
  const { data } = await client.mutate({
    mutation: UPSERT_PROFILE,
    variables: { object: input },
  });
  await refreshSessionClaims();
  return (data as any)?.insert_profiles_one;
}

export async function updateProfile(
  client: ApolloClient,
  userId: string,
  set: Partial<Profile>,
) {
  const { data } = await client.mutate({
    mutation: UPDATE_PROFILE,
    variables: { userId, set },
  });
  return (data as any)?.update_profiles_by_pk;
}

export async function submitVerification(
  client: ApolloClient,
  documentFileId: string,
) {
  const { data } = await client.mutate({
    mutation: INSERT_VERIFICATION,
    variables: {
      object: {
        document_file_id: documentFileId,
        method: 'id_upload',
      },
    },
  });
  return (data as any)?.insert_verifications_one;
}

export async function fetchAirlines(client: ApolloClient) {
  const { data } = await client.query({
    query: GET_AIRLINES,
    fetchPolicy: 'network-only',
  });
  return (data as any)?.airlines ?? [];
}
