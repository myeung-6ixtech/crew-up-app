import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents($now: timestamptz!) {
    events(where: { starts_at: { _gte: $now } }, order_by: { starts_at: asc }) {
      id
      title
      description
      city
      starts_at
      ends_at
      capacity
      visibility_scope
      tags
      languages
      creator_id
    }
  }
`;

export const GET_EVENTS_BY_CITY = gql`
  query GetEventsByCity($now: timestamptz!, $city: String!) {
    events(
      where: { starts_at: { _gte: $now }, city: { _eq: $city } }
      order_by: { starts_at: asc }
    ) {
      id
      title
      description
      city
      starts_at
      ends_at
      capacity
      visibility_scope
      tags
      languages
      creator_id
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: uuid!) {
    events_by_pk(id: $id) {
      id
      title
      description
      city
      venue_name
      venue_address
      starts_at
      ends_at
      capacity
      visibility_scope
      tags
      languages
      creator_id
      attendees {
        id
        user_id
        status
        user {
          profile {
            display_name
          }
        }
      }
    }
  }
`;

export const INSERT_EVENT = gql`
  mutation InsertEvent($object: events_insert_input!) {
    insert_events_one(object: $object) {
      id
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: uuid!, $set: events_set_input!) {
    update_events_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
    }
  }
`;

export const INSERT_ATTENDEE = gql`
  mutation InsertAttendee($object: event_attendees_insert_input!) {
    insert_event_attendees_one(object: $object) {
      id
      status
    }
  }
`;

export const UPDATE_ATTENDEE = gql`
  mutation UpdateAttendee($id: uuid!, $status: attendee_status!) {
    update_event_attendees_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`;

export const INSERT_EVENT_THREAD = gql`
  mutation InsertEventThread($thread: threads_insert_input!) {
    insert_threads_one(object: $thread) {
      id
    }
  }
`;

export const INSERT_THREAD_PARTICIPANT = gql`
  mutation InsertThreadParticipant($object: thread_participants_insert_input!) {
    insert_thread_participants_one(object: $object) {
      id
    }
  }
`;
