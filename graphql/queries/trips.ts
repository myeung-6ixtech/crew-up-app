import { gql } from '@apollo/client';

export const GET_MY_TRIPS = gql`
  query GetMyTrips($userId: uuid!, $now: timestamptz!) {
    user_trips(
      where: { user_id: { _eq: $userId }, is_active: { _eq: true } }
      order_by: { starts_at: asc_nulls_last }
    ) {
      id
      title
      source
      starts_at
      ends_at
      visibility
      is_active
      flightLegs(order_by: { sequence_number: asc }) {
        id
        sequence_number
        flight {
          id
          airline_iata
          flight_number
          service_date
          departure_airport
          arrival_airport
          scheduled_departure
          scheduled_arrival
        }
      }
      stays(order_by: { starts_at: asc }) {
        id
        city
        airport_iata
        starts_at
        ends_at
      }
    }
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
      source
      starts_at
      ends_at
      flightLegs(order_by: { sequence_number: asc }, limit: 1) {
        id
        flight {
          id
          airline_iata
          flight_number
          service_date
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
  }
`;

export const GET_TRIP_MATCHES = gql`
  query GetTripMatches {
    trip_matches(
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
  }
`;

export const DELETE_TRIP = gql`
  mutation DeleteTrip($id: uuid!) {
    update_user_trips_by_pk(pk_columns: { id: $id }, _set: { is_active: false }) {
      id
    }
  }
`;
