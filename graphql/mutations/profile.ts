import { gql } from '@apollo/client';

export const GET_MY_PROFILE = gql`
  query GetMyProfile($userId: uuid!) {
    profiles_by_pk(user_id: $userId) {
      user_id
      display_name
      airline_id
      base_airport
      role_type
      rank
      show_rank
      preferred_language
      default_visibility
      notification_mode
      is_verified
      avatar_file_id
    }
  }
`;

export const INSERT_PROFILE = gql`
  mutation InsertProfile($object: profiles_insert_input!) {
    insert_profiles_one(object: $object) {
      user_id
    }
  }
`;

export const UPSERT_PROFILE = gql`
  mutation UpsertProfile($object: profiles_insert_input!) {
    insert_profiles_one(
      object: $object
      on_conflict: {
        constraint: profiles_pkey
        update_columns: [
          display_name
          airline_id
          base_airport
          role_type
          preferred_language
          default_visibility
        ]
      }
    ) {
      user_id
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($userId: uuid!, $set: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { user_id: $userId }, _set: $set) {
      user_id
    }
  }
`;

export const INSERT_VERIFICATION = gql`
  mutation InsertVerification($object: verifications_insert_input!) {
    insert_verifications_one(object: $object) {
      id
      status
    }
  }
`;

export const GET_AIRLINES = gql`
  query GetAirlines {
    airlines(where: { is_active: { _eq: true } }, order_by: { name: asc }) {
      id
      code
      name
    }
  }
`;
