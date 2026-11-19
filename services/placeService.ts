import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';

export type VenueSuggestion = {
  id: string;
  name: string;
  /** Short area or address. */
  detail: string;
  /** Google place types, for the activity icon. */
  types?: string[];
  /** From the server (search) when it knew where to measure from. */
  distanceMeters?: number | null;
  /** Nearby results carry their coordinates and address already. */
  lat?: number | null;
  lng?: number | null;
  address?: string;
  city?: string | null;
};

export type VenuePlace = {
  id?: string;
  name: string;
  address: string;
  city: string | null;
  lat?: number | null;
  lng?: number | null;
};

type LatLng = { lat: number; lng: number };

type PlacesResponse = {
  places?: VenueSuggestion[];
  place?: VenuePlace | null;
  center?: LatLng | null;
  cityLabel?: string | null;
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

/**
 * Autocomplete, scoped to the meet's city: its coordinates when known (`center`), otherwise its name.
 * `origin` (the user, or the city centre) gives each result a distance.
 */
export async function searchVenues(
  query: string,
  city: string,
  sessionToken: string,
  signal?: AbortSignal,
  options: { center?: LatLng | null; origin?: LatLng | null } = {},
): Promise<VenueSuggestion[]> {
  const payload = await placesRequest(
    {
      query,
      city,
      sessionToken,
      ...(options.center ? { lat: options.center.lat, lng: options.center.lng } : {}),
      ...(options.origin ? { originLat: options.origin.lat, originLng: options.origin.lng } : {}),
    },
    signal,
  );
  return (payload.places ?? []).filter((place) => place.id && place.name);
}

/** "NEARBY IN {CITY}": places near the city centre that suit the meet's activities, closest first. */
export async function nearbyVenues(
  city: string,
  types: string[],
  signal?: AbortSignal,
): Promise<{ places: VenueSuggestion[]; center: LatLng | null; cityLabel: string | null }> {
  const payload = await placesRequest({ mode: 'nearby', city, types }, signal);
  return {
    places: (payload.places ?? []).filter((place) => place.id && place.name),
    center: payload.center ?? null,
    cityLabel: payload.cityLabel ?? null,
  };
}

/** The named place at a spot ("Use current location"). Null when there's nothing close by. */
export async function venueAt(at: LatLng, signal?: AbortSignal): Promise<VenueSuggestion | null> {
  const payload = await placesRequest({ mode: 'reverse', lat: at.lat, lng: at.lng }, signal);
  const place = payload.place as VenueSuggestion | null | undefined;
  return place?.id && place.name ? place : null;
}

/** Place Details. The address is the formatted Google address. */
export async function venueDetails(placeId: string, sessionToken: string, signal?: AbortSignal): Promise<VenuePlace> {
  const payload = await placesRequest({ placeId, sessionToken }, signal);
  if (!payload.place?.name && !payload.place?.address) {
    throw new Error('PLACES_UNAVAILABLE');
  }
  return {
    id: payload.place?.id ?? placeId,
    name: payload.place?.name ?? '',
    address: payload.place?.address ?? '',
    city: payload.place?.city ?? null,
    lat: payload.place?.lat ?? null,
    lng: payload.place?.lng ?? null,
  };
}
