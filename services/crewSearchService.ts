import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';

export type CrewSearchType = 'username' | 'crew_id';
export type FriendshipStatus = 'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self';

/** A search result. Never carries a Crew ID. */
export type CrewSearchResult = {
  id: string;
  displayName: string;
  handle: string | null;
  role: string | null;
  base: string | null;
  avatarFileId: string | null;
  friendshipStatus: FriendshipStatus;
};

/** GET /client/friends/search. Throws on network / server errors (the screen keeps its last results). */
export async function searchCrew(type: CrewSearchType, q: string, signal?: AbortSignal): Promise<CrewSearchResult[]> {
  const session = await nhost.refreshSession(60);
  if (!session?.accessToken) throw new Error('UNAUTHORIZED');
  const url = `${apiEndpoints.functions}/client/friends/search?type=${type}&q=${encodeURIComponent(q)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${session.accessToken}` }, signal });
  if (!response.ok) throw new Error(`SEARCH_${response.status}`);
  const payload = (await response.json()) as { results?: CrewSearchResult[] };
  return payload.results ?? [];
}
