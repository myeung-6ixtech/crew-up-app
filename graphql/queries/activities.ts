import { gql } from '@apollo/client';

export const GET_ACTIVITIES = gql`
  query GetActivities {
    activities(
      where: { is_active: { _eq: true } }
      order_by: [{ sort_order: asc }, { name: asc }]
    ) {
      id
      slug
      name
      description
      category
      kind
      icon
      sort_order
    }
  }
`;

export const GET_ACTIVITY_PREFERENCES = gql`
  query GetActivityPreferences($userId: uuid!) {
    profile_activity_preferences(where: { user_id: { _eq: $userId } }) {
      activity_id
      activity {
        id
        name
        kind
      }
    }
  }
`;

export const DELETE_ACTIVITY_PREFERENCES = gql`
  mutation DeleteActivityPreferences($userId: uuid!) {
    delete_profile_activity_preferences(where: { user_id: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

export const INSERT_ACTIVITY_PREFERENCES = gql`
  mutation InsertActivityPreferences($objects: [profile_activity_preferences_insert_input!]!) {
    insert_profile_activity_preferences(objects: $objects) {
      affected_rows
    }
  }
`;

export const INSERT_EVENT_ACTIVITIES = gql`
  mutation InsertEventActivities($objects: [event_activities_insert_input!]!) {
    insert_event_activities(objects: $objects) {
      affected_rows
    }
  }
`;
