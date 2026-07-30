import type { ApolloClient } from '@apollo/client';
import {
  GET_EVENT,
  GET_EVENTS,
  GET_EVENTS_BY_CITY,
  INSERT_ATTENDEE,
  INSERT_EVENT,
  INSERT_EVENT_THREAD,
  UPDATE_ATTENDEE,
  UPDATE_EVENT,
} from '@/graphql/queries/events';
import { GET_EVENT_THREAD, INSERT_THREAD_PARTICIPANT } from '@/graphql/mutations/messaging';

export async function fetchEvents(client: ApolloClient, city?: string) {
  const now = new Date().toISOString();
  if (city) {
    const { data } = await client.query({
      query: GET_EVENTS_BY_CITY,
      variables: { now, city },
    });
    return (data as any)?.events ?? [];
  }
  const { data } = await client.query({
    query: GET_EVENTS,
    variables: { now },
  });
  return (data as any)?.events ?? [];
}

export async function fetchEvent(client: ApolloClient, id: string) {
  const { data } = await client.query({
    query: GET_EVENT,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.events_by_pk;
}

export async function createEvent(
  client: ApolloClient,
  object: Record<string, unknown>,
) {
  const { data } = await client.mutate({
    mutation: INSERT_EVENT,
    variables: { object },
  });
  return (data as any)?.insert_events_one;
}

export async function updateEvent(
  client: ApolloClient,
  id: string,
  set: Record<string, unknown>,
) {
  await client.mutate({ mutation: UPDATE_EVENT, variables: { id, set } });
}

export async function rsvpEvent(
  client: ApolloClient,
  eventId: string,
  userId: string,
  status: 'going' | 'waitlisted' = 'going',
) {
  const { data } = await client.mutate({
    mutation: INSERT_ATTENDEE,
    variables: { object: { event_id: eventId, status } },
  });
  await ensureEventThreadMembership(client, eventId, userId);
  return (data as any)?.insert_event_attendees_one;
}

export async function updateRsvp(
  client: ApolloClient,
  attendeeId: string,
  status: 'going' | 'waitlisted' | 'cancelled',
) {
  await client.mutate({ mutation: UPDATE_ATTENDEE, variables: { id: attendeeId, status } });
}

async function ensureEventThreadMembership(
  client: ApolloClient,
  eventId: string,
  userId: string,
) {
  let threadId: string | undefined;
  const { data: threadData } = await client.query({
    query: GET_EVENT_THREAD,
    variables: { eventId },
    fetchPolicy: 'network-only',
  });
  threadId = (threadData as any)?.threads?.[0]?.id;

  if (!threadId) {
    const { data: created } = await client.mutate({
      mutation: INSERT_EVENT_THREAD,
      variables: {
        thread: { type: 'event_group', event_id: eventId },
      },
    });
    threadId = (created as any)?.insert_threads_one?.id;
  }

  if (threadId) {
    await client.mutate({
      mutation: INSERT_THREAD_PARTICIPANT,
      variables: { object: { thread_id: threadId, user_id: userId } },
    }).catch(() => {
      // Participant may already exist.
    });
  }
}

export async function createEventWithThread(
  client: ApolloClient,
  eventObject: Record<string, unknown>,
  creatorId: string,
) {
  const event = await createEvent(client, eventObject);
  if (event?.id) {
    await ensureEventThreadMembership(client, event.id, creatorId);
  }
  return event;
}
