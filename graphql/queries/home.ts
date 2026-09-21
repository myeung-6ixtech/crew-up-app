import { gql } from '@apollo/client';

export const GET_HOME_DATA = gql`
  query GetHomeData($userId: uuid!, $now: timestamptz!) {
    upcomingTrips: user_trips(
      where: {
        user_id: { _eq: $userId }
        is_active: { _eq: true }
        starts_at: { _gte: $now }
      }
      order_by: { starts_at: asc }
      limit: 10
    ) {
      id
      title
      starts_at
      ends_at
      flightLegs(order_by: { sequence_number: asc }, limit: 1) {
        flight {
          flight_number
          departure_airport
          arrival_airport
          scheduled_departure
          scheduled_arrival
        }
      }
      stays(order_by: { starts_at: asc }, limit: 1) {
        city
        starts_at
        ends_at
      }
    }
    allTrips: user_trips(
      where: { user_id: { _eq: $userId }, is_active: { _eq: true } }
      order_by: { starts_at: asc_nulls_last }
    ) {
      id
      starts_at
      ends_at
      stays {
        city
      }
    }
    tripMatches: trip_matches(
      order_by: [{ score: desc }, { created_at: desc }]
      limit: 40
    ) {
      id
      matched_user_id
      match_type
      score
      city
      flight_number
      departure_airport
      arrival_airport
      overlap_start
      overlap_end
      matchedUser {
        profile {
          display_name
          role_type
          base_airport
        }
      }
    }
    upcomingRosters: rosters(
      where: { user_id: { _eq: $userId }, layover_start: { _gte: $now } }
      order_by: { layover_start: asc }
      limit: 10
    ) {
      id
      flight_number
      departure_airport
      arrival_airport
      layover_city
      layover_start
      layover_end
      notes
    }
    allRosters: rosters(where: { user_id: { _eq: $userId } }) {
      id
      layover_city
      layover_start
      layover_end
      notes
    }
    connections(
      where: {
        _or: [{ requester_id: { _eq: $userId } }, { addressee_id: { _eq: $userId } }]
        status: { _eq: accepted }
      }
    ) {
      id
      created_at
      requester_id
      addressee_id
      requester {
        profile {
          display_name
        }
      }
      addressee {
        profile {
          display_name
        }
      }
    }
    presence(order_by: { date_start: asc }, limit: 40) {
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
      order_by: [{ featured_until: desc_nulls_last }, { starts_at: asc }]
      limit: 5
    ) {
      id
      title
      city
      starts_at
      tags
      host_type
      is_published
      featured_until
      eventActivities {
        activity {
          slug
          name
          icon
        }
      }
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
