import test from 'node:test';
import assert from 'node:assert/strict';

const { venueIcon, nearbyTypesFor, formatDistance, distanceMeters } = await import('../lib/venueCategory.ts');
const { ACTIVITY_ICONS } = await import('../constants/activityIcons.ts');

test('Google types map onto our activity icons, falling back to a pin', () => {
  assert.equal(venueIcon(['cafe', 'food', 'point_of_interest']), 'coffee');
  assert.equal(venueIcon(['gym', 'health']), 'gym');
  assert.equal(venueIcon(['bar', 'point_of_interest']), 'rooftop_bar');
  assert.equal(venueIcon(['wine_bar', 'bar']), 'wine');
  assert.equal(venueIcon(['beach', 'natural_feature']), 'beach');
  assert.equal(venueIcon(['point_of_interest']), null);
  assert.equal(venueIcon([]), null);
});

test('every mapped icon exists in the icon set', () => {
  for (const types of [['cafe'], ['gym'], ['bar'], ['beach'], ['museum'], ['park'], ['spa'], ['restaurant'], ['pub'], ['night_club']]) {
    const icon = venueIcon(types);
    assert.ok(icon && ACTIVITY_ICONS[icon], `${types} -> ${icon}`);
  }
});

test("nearby looks for places that suit the meet's activities", () => {
  assert.deepEqual(nearbyTypesFor(['coffee', 'gym']), ['cafe', 'coffee_shop', 'gym', 'fitness_center']);
  assert.deepEqual(nearbyTypesFor([]), []);
  assert.deepEqual(nearbyTypesFor(['unknown_slug']), []);
});

test('distances read like "350 m" and "1.2 km"', () => {
  assert.equal(formatDistance(347), '350 m');
  assert.equal(formatDistance(1234), '1.2 km');
  assert.equal(formatDistance(12_400), '12 km');
  assert.equal(formatDistance(null), '');
  const hkgToCentral = distanceMeters({ lat: 22.308, lng: 113.918 }, { lat: 22.282, lng: 114.158 });
  assert.ok(hkgToCentral > 24_000 && hkgToCentral < 26_000);
});
