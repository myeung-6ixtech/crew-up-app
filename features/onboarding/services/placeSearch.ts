import { COUNTRY_CODES, countryName } from '@crewup/shared';

export type PlaceHit = {
  id: string;
  name: string;
  detail: string;
  countryCode: string;
  latitude: number;
  longitude: number;
};

const PLACE_TYPES = new Set(['city', 'town', 'village', 'municipality', 'locality', 'hamlet']);

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_type?: string;
    osm_id?: number;
    name?: string;
    country?: string;
    countrycode?: string;
    state?: string;
    county?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
};

/** Photon tags Hong Kong and Macao as China. CrewUp keeps them as their own countries. */
function countryCodeFrom(properties: PhotonFeature['properties']): string | null {
  const state = properties?.state?.trim().toLowerCase() ?? '';
  const name = properties?.name?.trim().toLowerCase() ?? '';
  if (state === 'hong kong' || name === 'hong kong') return 'HK';
  if (state === 'macau' || state === 'macao' || name === 'macau' || name === 'macao') return 'MO';
  const code = properties?.countrycode?.trim().toUpperCase() ?? '';
  return COUNTRY_CODES.has(code) ? code : null;
}

function placeDetail(properties: PhotonFeature['properties'], countryCode: string): string {
  const region = properties?.state || properties?.county || '';
  const country = countryName(countryCode) ?? properties?.country ?? '';
  if (region && country && region.toLowerCase() === country.toLowerCase()) return country;
  return [region, country].filter(Boolean).join(', ');
}

function toPlace(feature: PhotonFeature): PlaceHit | null {
  const properties = feature.properties;
  const [longitude, latitude] = feature.geometry?.coordinates ?? [];
  const name = properties?.name?.trim();
  if (!name || latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  const kind = properties?.osm_value || properties?.type;
  const countryCode = countryCodeFrom(properties);
  if (!countryCode || properties?.osm_key !== 'place' || (kind && !PLACE_TYPES.has(kind))) return null;
  return {
    id: `${properties?.osm_type ?? 'N'}:${properties?.osm_id ?? name}`,
    name: name.slice(0, 100),
    detail: placeDetail(properties, countryCode),
    countryCode,
    latitude,
    longitude,
  };
}

/** City search. Coordinates are stored on the profile for later use and are not shown to other crew. */
export async function searchHometowns(query: string, signal?: AbortSignal): Promise<PlaceHit[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error('City search is unavailable. Try again.');
  }
  const body = (await response.json()) as { features?: PhotonFeature[] };
  const places: PlaceHit[] = [];
  const seen = new Set<string>();
  for (const feature of body.features ?? []) {
    const place = toPlace(feature);
    if (!place) continue;
    const key = `${place.name}|${place.detail}|${place.latitude.toFixed(3)}|${place.longitude.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push(place);
  }
  return places;
}
