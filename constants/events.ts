/** Maps UI meet type to `events.visibility_scope` enum values. */
export type EventMeetType = 'public' | 'private';

export const EVENT_MEET_VISIBILITY: Record<EventMeetType, 'all_verified' | 'friends'> = {
  public: 'all_verified',
  private: 'friends',
};

export function meetTypeFromVisibilityScope(
  scope?: string | null,
): EventMeetType {
  return scope === 'friends' ? 'private' : 'public';
}

/** Private meets need their PIN before you can see details, RSVP or chat. */
export function isPrivateEvent(event: { visibility_scope?: string | null } | null | undefined): boolean {
  return meetTypeFromVisibilityScope(event?.visibility_scope) === 'private';
}

/** `K7PQ4X` → `K7P-Q4X`. */
export function formatEventPin(pin: string): string {
  return pin.length === 6 ? `${pin.slice(0, 3)}-${pin.slice(3)}` : pin;
}

/** What the unlock endpoint accepts: no case, dashes or spaces. */
export function normalizeEventPinInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
