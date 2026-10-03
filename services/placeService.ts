import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';

export type VenueSuggestion = {
  id: string;
  name: string;
  detail: string;
};

export type VenuePlace = {
  name: string;
  address: string;
  city: string | null;
};

type PlacesResponse = {
  places?: VenueSuggestion[];
  place?: VenuePlace;
  error?: { code?: string; message?: string };
  message?: string;
};

async function placesRequest(body: Record<string, unknown>, signal?: AbortSignal): Promise<PlacesResponse> {
  const session = await nhost.refreshSession(60);
  if (!session?.accessToken) {
    throw new Error('PLACES_UNAVAILABLE');
  }
  const response = await fetch(`${apiEndpoints.functions}/client/places/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });
  let payload: PlacesResponse = {};
  try {
    payload = (await response.json()) as PlacesResponse;
  } catch {
    payload = {};
  }
  if (!response.ok) {
    throw new Error(payload.error?.code ?? 'PLACES_UNAVAILABLE');
  }
  return payload;
}

/** Autocomplete. `city` biases the search when the meet already has one. */
export async function searchVenues(
  query: string,
  city: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<VenueSuggestion[]> {
  const payload = await placesRequest({ query, city, sessionToken }, signal);
  return (payload.places ?? []).filter((place) => place.id && place.name);
}

/** Place Details. The address is the formatted Google address. */
export async function venueDetails(placeId: string, sessionToken: string, signal?: AbortSignal): Promise<VenuePlace> {
  const payload = await placesRequest({ placeId, sessionToken }, signal);
  if (!payload.place?.name && !payload.place?.address) {
    throw new Error('PLACES_UNAVAILABLE');
  }
  return {
    name: payload.place?.name ?? '',
    address: payload.place?.address ?? '',
    city: payload.place?.city ?? null,
  };
}
