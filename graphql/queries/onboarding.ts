import { gql } from '@apollo/client';

export const ONBOARDING_STATE_FIELDS = gql`
  fragment OnboardingStateFields on onboarding_state {
    user_id
    current_step
    flow_version
    beta_signup_completed_at
    onboarding_completed_at
    guidelines_accepted_version
  }
`;

export const GET_MY_ONBOARDING_STATE = gql`
  ${ONBOARDING_STATE_FIELDS}
  query GetMyOnboardingState($userId: uuid!) {
    onboarding_state_by_pk(user_id: $userId) {
      ...OnboardingStateFields
    }
  }
`;

/** Private per-user data (phone). Readable by the owner only. */
export const GET_MY_PRIVATE = gql`
  query GetMyPrivate($userId: uuid!) {
    user_private_by_pk(user_id: $userId) {
      user_id
      phone_e164
      phone_verified_at
    }
  }
`;
