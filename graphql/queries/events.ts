import { gql } from '@apollo/client';

/** `event_listings` fields: no notes or venue, so private meets can be listed before they are unlocked. */
const EVENT_LISTING_FIELDS = `
  id
  title
  city
  starts_at
  ends_at
  capacity
  visibility_scope
  tags
  languages
  creator_id
  host_type
  is_published
  featured_until
  featured_image_file_id
  rsvp_closed_at
  cancelled_at
  eventActivities {
    activity {
      id
      slug
      name
      icon
      kind
    }
  }
`;

export const GET_EVENTS = gql`
  query GetEvents($now: timestamptz!) {
    event_listings(where: { starts_at: { _gte: $now } }, order_by: { starts_at: asc }) {
      ${EVENT_LISTING_FIELDS}
    }
  }
`;

export const GET_EVENTS_BY_CITY = gql`
  query GetEventsByCity($now: timestamptz!, $city: String!) {
    event_listings(
      where: { starts_at: { _gte: $now }, city: { _eq: $city } }
      order_by: { starts_at: asc }
    ) {
      ${EVENT_LISTING_FIELDS}
    }
  }
`;

/** What a locked private meet shows behind the PIN prompt. */
export const GET_EVENT_PREVIEW = gql`
  query GetEventPreview($id: uuid!) {
    event_listings(where: { id: { _eq: $id } }, limit: 1) {
      ${EVENT_LISTING_FIELDS}
    }
  }
`;

/** Private meets this user has unlocked with a PIN (Hasura only returns their own rows). */
export const GET_MY_EVENT_UNLOCKS = gql`
  query GetMyEventUnlocks {
    event_unlocks {
      event_id
    }
  }
`;

/** Host only (Hasura returns null to anyone else). */
export const GET_EVENT_PIN = gql`
  query GetEventPin($eventId: uuid!) {
    event_access_codes_by_pk(event_id: $eventId) {
      pin
      rotated_at
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
      host_type
      is_published
      featured_until
      featured_image_file_id
      rsvp_closed_at
      cancelled_at
      creator {
        id
        profile {
          display_name
          preferred_name
          avatar_file_id
          crew_role
          role_type
          airline_id
        }
      }
      eventActivities {
        activity {
          id
          slug
          name
          icon
          kind
        }
      }
      attendees {
        id
        user_id
        status
        user {
          profile {
            display_name
            preferred_name
            avatar_file_id
            crew_role
            role_type
            airline_id
            base_airport_iata
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

/** The searched place behind a meet's venue. Separate from GET_EVENT so the meet page still loads on a backend without these columns. */
export const GET_EVENT_VENUE_PLACE = gql`
  query GetEventVenuePlace($id: uuid!) {
    events_by_pk(id: $id) {
      id
      venue_place_id
      venue_lat
      venue_lng
    }
  }
`;

/**
 * Related events on a layover: public, published meets in the layover city that overlap the rest window, soonest
 * first. Runs with the user's permissions, which already hide private meets they haven't unlocked and anyone blocked
 * either way. An event without an end counts as lasting 2 hours ($startsAfter = layover start − 2h).
 */
export const GET_LAYOVER_RELATED_EVENTS = gql`
  query GetLayoverRelatedEvents($city: String!, $from: timestamptz!, $to: timestamptz!, $startsAfter: timestamptz!, $limit: Int!) {
    events(
      where: {
        city: { _ilike: $city }
        cancelled_at: { _is_null: true }
        visibility_scope: { _neq: friends }
        _or: [{ host_type: { _eq: user } }, { is_published: { _eq: true } }]
        starts_at: { _lt: $to }
        _and: [{ _or: [{ ends_at: { _gt: $from } }, { _and: [{ ends_at: { _is_null: true } }, { starts_at: { _gt: $startsAfter } }] }] }]
      }
      order_by: { starts_at: asc }
      limit: $limit
    ) {
      id
      title
      city
      starts_at
      ends_at
      venue_name
      featured_image_file_id
      eventActivities {
        activity {
          slug
          name
          kind
        }
      }
    }
  }
`;

/** Covers from approved event sources. Separate so the section still loads on a backend without the column. */
export const GET_EVENT_COVER_URLS = gql`
  query GetEventCoverUrls($ids: [uuid!]!) {
    events(where: { id: { _in: $ids } }) {
      id
      cover_image_url
    }
  }
`;
