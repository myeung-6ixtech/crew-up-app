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
