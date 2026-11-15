import { gql } from '@apollo/client';

export const GET_MY_THREADS = gql`
  query GetMyThreads($userId: uuid!) {
    thread_participants(
      where: { user_id: { _eq: $userId } }
      order_by: { joined_at: desc }
    ) {
      id
      thread_id
      last_read_at
      thread {
        id
        type
        updated_at
        event_id
        event {
          title
          city
        }
        messages(limit: 1, order_by: { created_at: desc }) {
          body
          kind
          meta
          sender_id
          created_at
        }
        participants {
          user_id
          user {
            profile {
              display_name
              preferred_name
              full_name
              avatar_file_id
              crew_role
              role_type
              base_airport
              base_airport_iata
            }
          }
        }
      }
    }
  }
`;

/** Same inbox query without wave columns, for a server that has not applied that migration yet. */
export const GET_MY_THREADS_PLAIN = gql`
  query GetMyThreadsPlain($userId: uuid!) {
    thread_participants(
      where: { user_id: { _eq: $userId } }
      order_by: { joined_at: desc }
    ) {
      id
      thread_id
      last_read_at
      thread {
        id
        type
        updated_at
        event_id
        event {
          title
          city
        }
        messages(limit: 1, order_by: { created_at: desc }) {
          body
          sender_id
          created_at
        }
        participants {
          user_id
          user {
            profile {
              display_name
              preferred_name
              full_name
              avatar_file_id
              crew_role
              role_type
              base_airport
              base_airport_iata
            }
          }
        }
      }
    }
  }
`;

export const GET_THREAD_MESSAGES = gql`
  query GetThreadMessages($threadId: uuid!, $before: timestamptz!, $limit: Int!) {
    messages(
      where: { thread_id: { _eq: $threadId }, created_at: { _lt: $before } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      thread_id
      sender_id
      body
      kind
      meta
      removed_at
      created_at
      updated_at
    }
  }
`;

export const GET_THREAD_MESSAGES_PLAIN = gql`
  query GetThreadMessagesPlain($threadId: uuid!, $before: timestamptz!, $limit: Int!) {
    messages(
      where: { thread_id: { _eq: $threadId }, created_at: { _lt: $before } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      thread_id
      sender_id
      body
      removed_at
      created_at
      updated_at
    }
  }
`;

export const GET_MY_WAVES = gql`
  query GetMyWaves($userId: uuid!) {
    messages(
      where: { sender_id: { _eq: $userId }, kind: { _eq: "wave" } }
      order_by: { created_at: desc }
      limit: 200
    ) {
      meta
      thread {
        participants {
          user_id
        }
      }
    }
  }
`;

export const INSERT_MESSAGE = gql`
  mutation InsertMessage($object: messages_insert_input!) {
    insert_messages_one(object: $object) {
      id
      created_at
    }
  }
`;

export const INSERT_DIRECT_THREAD = gql`
  mutation InsertDirectThread($thread: threads_insert_input!) {
    insert_threads_one(object: $thread) {
      id
    }
  }
`;

export const GET_EVENT_THREAD = gql`
  query GetEventThread($eventId: uuid!) {
    threads(where: { event_id: { _eq: $eventId } }, limit: 1) {
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

export const UPDATE_LAST_READ = gql`
  mutation UpdateLastRead($id: uuid!, $lastReadAt: timestamptz!) {
    update_thread_participants_by_pk(
      pk_columns: { id: $id }
      _set: { last_read_at: $lastReadAt }
    ) {
      id
    }
  }
`;

/** The other member of direct threads, including one this user started by sending first. */
export const GET_DIRECT_COUNTERPARTS = gql`
  query GetDirectCounterparts($userId: uuid!, $threadIds: [uuid!]!) {
    thread_participants(
      where: { user_id: { _neq: $userId }, thread_id: { _in: $threadIds }, thread: { type: { _eq: direct } } }
    ) {
      thread_id
      user_id
      user {
        profile {
          display_name
          preferred_name
          full_name
          avatar_file_id
          crew_role
          role_type
          base_airport
          base_airport_iata
        }
      }
    }
  }
`;

export const UNREAD_DIRECT = gql`
  query UnreadDirect($userId: uuid!) {
    thread_participants(
      where: { user_id: { _eq: $userId }, thread: { type: { _eq: direct } } }
    ) {
      last_read_at
      thread {
        participants {
          user_id
        }
        messages(limit: 1, order_by: { created_at: desc }) {
          sender_id
          created_at
        }
      }
    }
  }
`;

/** Wakes the nav dot. Hasura does not replay this when a thread is only marked read. */
export const DIRECT_MESSAGE_WAKE = gql`
  subscription DirectMessageWake($userId: uuid!) {
    messages(
      where: {
        sender_id: { _neq: $userId }
        thread: { type: { _eq: direct }, participants: { user_id: { _eq: $userId } } }
      }
      limit: 1
      order_by: { created_at: desc }
    ) {
      id
    }
  }
`;

export const MESSAGES_SUBSCRIPTION_PLAIN = gql`
  subscription MessagesSubscriptionPlain($threadId: uuid!, $since: timestamptz!) {
    messages(
      where: {
        thread_id: { _eq: $threadId }
        _or: [{ created_at: { _gte: $since } }, { updated_at: { _gte: $since } }]
      }
      order_by: { created_at: asc }
    ) {
      id
      thread_id
      sender_id
      body
      removed_at
      created_at
      updated_at
    }
  }
`;

export const MESSAGES_SUBSCRIPTION = gql`
  subscription MessagesSubscription($threadId: uuid!, $since: timestamptz!) {
    messages(
      where: {
        thread_id: { _eq: $threadId }
        _or: [{ created_at: { _gte: $since } }, { updated_at: { _gte: $since } }]
      }
      order_by: { created_at: asc }
    ) {
      id
      thread_id
      sender_id
      body
      kind
      meta
      removed_at
      created_at
      updated_at
    }
  }
`;
