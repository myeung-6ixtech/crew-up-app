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
          created_at
        }
        participants {
          user_id
          user {
            profile {
              display_name
            }
          }
        }
      }
    }
  }
`;

export const GET_THREAD_MESSAGES = gql`
  query GetThreadMessages($threadId: uuid!) {
    messages(
      where: { thread_id: { _eq: $threadId } }
      order_by: { created_at: asc }
    ) {
      id
      thread_id
      sender_id
      body
      created_at
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

export const MESSAGES_SUBSCRIPTION = gql`
  subscription MessagesSubscription($threadId: uuid!) {
    messages(
      where: { thread_id: { _eq: $threadId } }
      order_by: { created_at: asc }
    ) {
      id
      thread_id
      sender_id
      body
      created_at
    }
  }
`;
