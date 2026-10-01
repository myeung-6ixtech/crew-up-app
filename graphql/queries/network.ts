import { gql } from '@apollo/client';

export const GET_MY_FRIEND_ID = gql`
  query GetMyFriendId($userId: uuid!) {
    profiles_by_pk(user_id: $userId) {
      friend_id
    }
  }
`;

export const GET_CONNECTIONS = gql`
  query GetConnections($userId: uuid!) {
    connections(
      where: {
        _or: [{ requester_id: { _eq: $userId } }, { addressee_id: { _eq: $userId } }]
      }
      order_by: { created_at: desc }
    ) {
      id
      requester_id
      addressee_id
      status
      message
      requester {
        profile {
          display_name
          preferred_name
          role_type
          crew_role
          base_airport
          base_airport_iata
          avatar_file_id
        }
      }
      addressee {
        profile {
          display_name
          preferred_name
          role_type
          crew_role
          base_airport
          base_airport_iata
          avatar_file_id
        }
      }
    }
  }
`;

export const INSERT_CONNECTION = gql`
  mutation InsertConnection($object: connections_insert_input!) {
    insert_connections_one(object: $object) {
      id
      status
    }
  }
`;

export const UPDATE_CONNECTION = gql`
  mutation UpdateConnection($id: uuid!, $status: connection_status!) {
    update_connections_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`;

export const DISCOVER_PROFILES = gql`
  query DiscoverProfiles($where: profiles_bool_exp!, $limit: Int!, $offset: Int!) {
    profiles(where: $where, limit: $limit, offset: $offset, order_by: { display_name: asc }) {
      user_id
      display_name
      role_type
      base_airport
      airline_id
      is_verified
      avatar_file_id
    }
  }
`;

export const GET_PUBLIC_PROFILE = gql`
  query GetPublicProfile($userId: uuid!) {
    profiles_by_pk(user_id: $userId) {
      user_id
      display_name
      preferred_name
      username
      avatar_file_id
      role_type
      crew_role
      base_airport
      base_airport_iata
      airline_id
      is_verified
      show_rank
      rank
      friend_id
      residence_city
      residence_country_code
      hometown_city
      home_country_code
      languages
      visible_gender
      created_at
    }
  }
`;

export const INSERT_BLOCK = gql`
  mutation InsertBlock($object: user_blocks_insert_input!) {
    insert_user_blocks_one(object: $object) {
      id
    }
  }
`;

export const GET_BLOCKS = gql`
  query GetBlocks($userId: uuid!) {
    user_blocks(where: { blocker_id: { _eq: $userId } }) {
      id
      blocked_id
      created_at
      blocked {
        profile {
          display_name
        }
      }
    }
  }
`;
