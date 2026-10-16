import type { ApolloClient } from '@apollo/client';
import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';
import {
  GET_EVENT,
  GET_EVENT_PIN,
  GET_EVENT_PREVIEW,
  GET_EVENTS,
  GET_EVENTS_BY_CITY,
  INSERT_ATTENDEE,
  INSERT_EVENT,
  INSERT_EVENT_THREAD,
  UPDATE_ATTENDEE,
  UPDATE_EVENT,
} from '@/graphql/queries/events';
import { DELETE_EVENT_ACTIVITIES, INSERT_EVENT_ACTIVITIES } from '@/graphql/queries/activities';
import { GET_EVENT_THREAD, INSERT_THREAD_PARTICIPANT } from '@/graphql/mutations/messaging';
import { normalizeEventVisibilityScope } from '@/lib/visibilityOptions';

function withNormalizedVisibilityScope(
  object: Record<string, unknown>,
  airlineId?: string | null,
): Record<string, unknown> {
  if (typeof object.visibility_scope !== 'string') return object;
  return {
    ...object,
    visibility_scope: normalizeEventVisibilityScope(object.visibility_scope, airlineId),
  };
}

export async function fetchEvents(client: ApolloClient, city?: string) {
  const now = new Date().toISOString();
  if (city) {
    const { data } = await client.query({
      query: GET_EVENTS_BY_CITY,
      variables: { now, city },
    });
    return (data as any)?.event_listings ?? [];
  }
  const { data } = await client.query({
    query: GET_EVENTS,
    variables: { now },
  });
  return (data as any)?.event_listings ?? [];
}

/** Full meet, or null when the caller can't see it yet (a private meet they haven't unlocked). */
export async function fetchEvent(client: ApolloClient, id: string) {
  const { data } = await client.query({
    query: GET_EVENT,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.events_by_pk ?? null;
}

/** List-card fields for a meet, including a private one that is still locked. */
export async function fetchEventPreview(client: ApolloClient, id: string) {
  const { data } = await client.query({
    query: GET_EVENT_PREVIEW,
    variables: { id },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.event_listings?.[0] ?? null;
}

/** Host only. */
export async function fetchEventPin(
  client: ApolloClient,
  eventId: string,
): Promise<{ pin: string; rotated_at: string | null } | null> {
  const { data } = await client.query({
    query: GET_EVENT_PIN,
    variables: { eventId },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.event_access_codes_by_pk ?? null;
}

export class EventPinError extends Error {
  readonly code: string;
  readonly attemptsLeft?: number;
  readonly retryAfterSeconds?: number;

  constructor(code: string, message: string, extra?: { attemptsLeft?: number; retryAfterSeconds?: number }) {
    super(message);
    this.name = 'EventPinError';
    this.code = code;
    this.attemptsLeft = extra?.attemptsLeft;
    this.retryAfterSeconds = extra?.retryAfterSeconds;
  }
}

async function postEventFunction<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const session = await nhost.refreshSession(60);
  if (!session?.accessToken) throw new EventPinError('UNAUTHORIZED', 'Not authenticated');
  const response = await fetch(`${apiEndpoints.functions}/client/events/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string; attemptsLeft?: number; retryAfterSeconds?: number };
  } & T;
  if (!response.ok) {
    throw new EventPinError(payload.error?.code ?? 'UNKNOWN', payload.error?.message ?? 'Something went wrong', {
      attemptsLeft: payload.error?.attemptsLeft,
      retryAfterSeconds: payload.error?.retryAfterSeconds,
    });
  }
  return payload;
}

/** Enter a private meet's PIN. Throws `EventPinError` (EVENT_PIN_INVALID, EVENT_PIN_LOCKED, …). */
export async function unlockEvent(eventId: string, pin: string): Promise<void> {
  await postEventFunction('unlock', { eventId, pin });
}

/** Host only: replace the PIN. People who already unlocked keep access. */
export async function rotateEventPin(eventId: string): Promise<{ pin: string; rotatedAt: string }> {
  return postEventFunction('rotate-pin', { eventId });
}

export async function createEvent(
  client: ApolloClient,
  object: Record<string, unknown>,
  airlineId?: string | null,
) {
  const { data } = await client.mutate({
    mutation: INSERT_EVENT,
    variables: { object: withNormalizedVisibilityScope(object, airlineId) },
  });
  return (data as any)?.insert_events_one;
}

export async function updateEvent(
  client: ApolloClient,
  id: string,
  set: Record<string, unknown>,
  airlineId?: string | null,
) {
  await client.mutate({
    mutation: UPDATE_EVENT,
    variables: { id, set: withNormalizedVisibilityScope(set, airlineId) },
  });
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
  status: 'going' | 'waitlisted' | 'cancelled' | 'removed',
) {
  await client.mutate({ mutation: UPDATE_ATTENDEE, variables: { id: attendeeId, status } });
}

/** Host only: take someone off the meet. They can't RSVP to it again. */
export async function removeAttendee(client: ApolloClient, attendeeId: string) {
  await updateRsvp(client, attendeeId, 'removed');
}

/** Host only: stop new RSVPs (reversible) or cancel the meet (final). */
export async function setEventClosure(
  client: ApolloClient,
  eventId: string,
  closure: 'rsvps_closed' | 'reopened' | 'cancelled',
) {
  const now = new Date().toISOString();
  const set =
    closure === 'cancelled'
      ? { cancelled_at: now }
      : { rsvp_closed_at: closure === 'rsvps_closed' ? now : null };
  await client.mutate({ mutation: UPDATE_EVENT, variables: { id: eventId, set } });
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

export async function insertEventActivities(
  client: ApolloClient,
  eventId: string,
  activityIds: string[],
) {
  if (activityIds.length === 0) return;
  await client.mutate({
    mutation: INSERT_EVENT_ACTIVITIES,
    variables: {
      objects: activityIds.map((activity_id) => ({ event_id: eventId, activity_id })),
    },
  });
}

/** Replaces every activity and interest on a meet the caller hosts. */
export async function replaceEventActivities(client: ApolloClient, eventId: string, activityIds: string[]) {
  await client.mutate({
    mutation: DELETE_EVENT_ACTIVITIES,
    variables: { eventId },
  });
  await insertEventActivities(client, eventId, activityIds);
}

export async function createEventWithThread(
  client: ApolloClient,
  eventObject: Record<string, unknown>,
  creatorId: string,
  airlineId?: string | null,
) {
  const event = await createEvent(client, eventObject, airlineId);
  if (event?.id) {
    await ensureEventThreadMembership(client, event.id, creatorId);
  }
  return event;
}
