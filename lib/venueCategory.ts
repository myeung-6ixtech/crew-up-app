/**
 * Venue icons and nearby suggestions. Google place types map onto our activity icons (café → Coffee, gym → Gym,
 * bar → Rooftop bar / Drinks, beach → Beach…), falling back to a pin; the meet's activities map back to the place
 * types nearby suggestions look for. Dependency-free so it's unit-tested (scripts/venue-category.test.mjs).
 */

/** First matching Google type wins, so more specific types come first. */
const TYPE_TO_ICON: [string, string][] = [
  ['coffee_shop', 'coffee'],
  ['cafe', 'coffee'],
  ['tea_house', 'afternoon_tea'],
  ['bakery', 'dessert_crawl'],
  ['dessert_shop', 'dessert_crawl'],
  ['ice_cream_shop', 'dessert_crawl'],
  ['gym', 'gym'],
  ['fitness_center', 'gym'],
  ['yoga_studio', 'yoga'],
  ['swimming_pool', 'swimming'],
  ['beach', 'beach'],
  ['wine_bar', 'wine'],
  ['pub', 'beer'],
  ['brewery', 'craft_beer'],
  ['night_club', 'clubbing'],
  ['karaoke', 'karaoke'],
  ['bar', 'rooftop_bar'],
  ['ramen_restaurant', 'ramen'],
  ['sushi_restaurant', 'omakase'],
  ['japanese_restaurant', 'izakaya'],
  ['korean_restaurant', 'korean_bbq'],
  ['chinese_restaurant', 'dim_sum'],
  ['vegan_restaurant', 'vegan'],
  ['vegetarian_restaurant', 'vegan'],
  ['brunch_restaurant', 'brunch'],
  ['breakfast_restaurant', 'brunch'],
  ['restaurant', 'dinner'],
  ['food_court', 'hawker_centre'],
  ['spa', 'spa'],
  ['massage', 'foot_massage'],
  ['sauna', 'sauna'],
  ['museum', 'museum'],
  ['art_gallery', 'art'],
  ['movie_theater', 'cinema'],
  ['performing_arts_theater', 'theatre'],
  ['bowling_alley', 'bowling'],
  ['amusement_park', 'theme_park'],
  ['zoo', 'zoo_wildlife'],
  ['aquarium', 'zoo_wildlife'],
  ['hiking_area', 'hiking'],
  ['national_park', 'hiking'],
  ['park', 'picnic'],
  ['golf_course', 'golf'],
  ['stadium', 'sporting_events'],
  ['sports_complex', 'sporting_events'],
  ['shopping_mall', 'shopping'],
  ['market', 'markets'],
  ['airport', 'airport_meetup'],
  ['tourist_attraction', 'sightseeing'],
  ['hindu_temple', 'temples'],
  ['buddhist_temple', 'temples'],
  ['place_of_worship', 'temples'],
];

/** Our activity icon for a place, or null for the pin. */
export function venueIcon(types: readonly string[] | null | undefined): string | null {
  if (!types?.length) return null;
  for (const [type, icon] of TYPE_TO_ICON) if (types.includes(type)) return icon;
  return null;
}

/** Activity slug → the Google place types worth suggesting for it (Places API (New) Table A). */
const ACTIVITY_TO_TYPES: Record<string, string[]> = {
  coffee: ['cafe', 'coffee_shop'],
  specialty_coffee: ['coffee_shop', 'cafe'],
  afternoon_tea: ['tea_house', 'cafe'],
  brunch: ['brunch_restaurant', 'cafe'],
  crew_breakfast: ['breakfast_restaurant', 'cafe'],
  dessert_crawl: ['dessert_shop', 'bakery'],
  cocktail: ['bar'],
  cocktail_bar: ['bar'],
  rooftop_bar: ['bar'],
  bar_hopping: ['bar', 'pub'],
  drinks: ['bar', 'pub'],
  wine: ['wine_bar'],
  wine_tasting: ['wine_bar'],
  beer: ['pub', 'bar'],
  craft_beer: ['pub', 'bar'],
  sports_bar: ['bar', 'pub'],
  clubbing: ['night_club'],
  karaoke: ['karaoke'],
  gym: ['gym', 'fitness_center'],
  crossfit: ['gym', 'fitness_center'],
  yoga: ['yoga_studio'],
  pilates: ['yoga_studio', 'fitness_center'],
  swimming: ['swimming_pool'],
  beach: ['beach'],
  hiking: ['hiking_area', 'park'],
  trail_running: ['park', 'hiking_area'],
  running: ['park'],
  run_club: ['park'],
  picnic: ['park'],
  golf: ['golf_course'],
  bowling: ['bowling_alley'],
  museum: ['museum'],
  art: ['art_gallery', 'museum'],
  cinema: ['movie_theater'],
  movies: ['movie_theater'],
  theatre: ['performing_arts_theater'],
  spa: ['spa'],
  foot_massage: ['massage', 'spa'],
  sauna: ['spa'],
  dinner: ['restaurant'],
  food: ['restaurant'],
  street_food: ['food_court', 'restaurant'],
  hawker_centre: ['food_court'],
  dim_sum: ['chinese_restaurant'],
  ramen: ['ramen_restaurant'],
  izakaya: ['japanese_restaurant', 'bar'],
  korean_bbq: ['korean_restaurant'],
  vegan: ['vegan_restaurant', 'vegetarian_restaurant'],
  shopping: ['shopping_mall'],
  markets: ['market'],
  night_market: ['market'],
  theme_park: ['amusement_park'],
  zoo_wildlife: ['zoo'],
  sightseeing: ['tourist_attraction'],
  temples: ['place_of_worship'],
  sporting_events: ['stadium'],
};

/** Place types for "NEARBY IN {CITY}", from the meet's activities (empty: the server's everyday set). */
export function nearbyTypesFor(activitySlugs: readonly string[]): string[] {
  const types = new Set<string>();
  for (const slug of activitySlugs) for (const type of ACTIVITY_TO_TYPES[slug] ?? []) types.add(type);
  return [...types].slice(0, 20);
}

/** "350 m", "1.2 km", "12 km". */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || !Number.isFinite(meters) || meters < 0) return '';
  if (meters < 950) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/** Great-circle distance in metres. */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
