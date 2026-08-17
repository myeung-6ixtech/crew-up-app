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
      icon
      sort_order
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
