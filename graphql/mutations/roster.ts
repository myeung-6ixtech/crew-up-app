import { gql } from '@apollo/client';

export const GET_MY_ROSTERS = gql`
  query GetMyRosters($userId: uuid!) {
    rosters(
      where: { user_id: { _eq: $userId } }
      order_by: { layover_start: asc }
    ) {
      id
      flight_number
      departure_airport
      arrival_airport
      layover_city
      layover_start
      layover_end
      source
    }
  }
`;

export const INSERT_ROSTERS = gql`
  mutation InsertRosters($objects: [rosters_insert_input!]!) {
    insert_rosters(objects: $objects) {
      affected_rows
    }
  }
`;

export const DELETE_ROSTER = gql`
  mutation DeleteRoster($id: uuid!) {
    delete_rosters_by_pk(id: $id) {
      id
    }
  }
`;

export const UPDATE_ROSTER = gql`
  mutation UpdateRoster($id: uuid!, $set: rosters_set_input!) {
    update_rosters_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
    }
  }
`;
