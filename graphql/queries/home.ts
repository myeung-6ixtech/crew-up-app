import { gql } from '@apollo/client';

export const GET_HOME_DATA = gql`
  query GetHomeData($userId: uuid!, $now: timestamptz!) {
    rosters(
      where: { user_id: { _eq: $userId }, layover_start: { _gte: $now } }
      order_by: { layover_start: asc }
      limit: 5
    ) {
      id
      layover_city
      layover_start
      layover_end
    }
    presence(order_by: { date_start: asc }, limit: 20) {
      id
      user_id
      city
      date_start
      date_end
      visibility
      user {
        profile {
          display_name
          role_type
          base_airport
          is_verified
        }
      }
    }
    events(
      where: { starts_at: { _gte: $now } }
      order_by: { starts_at: asc }
      limit: 10
    ) {
      id
      title
      city
      starts_at
      tags
      languages
      creator_id
    }
  }
`;

export const GET_PRESENCE_BY_CITY = gql`
  query GetPresenceByCity($city: String!) {
    presence(
      where: { city: { _eq: $city }, visibility: { _neq: off } }
      order_by: { date_start: asc }
    ) {
      id
      user_id
      city
      date_start
      date_end
      user {
        profile {
          display_name
          role_type
          base_airport
          airline_id
          is_verified
        }
      }
    }
  }
`;
