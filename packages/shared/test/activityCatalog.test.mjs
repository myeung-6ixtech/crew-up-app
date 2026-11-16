import test from 'node:test';
import assert from 'node:assert/strict';

const {
  catalogGroups,
  countPicked,
  onboardingActivityGroups,
  onboardingInterestGroups,
  selectableIds,
} = await import('../src/activities/catalog.ts');

const P = {
  food: { slug: 'food_drink', name: 'Food', sort_order: 20 },
  drinks: { slug: 'drinks', name: 'Drinks', sort_order: 25 },
  nightlife: { slug: 'nightlife', name: 'Nightlife', sort_order: 30 },
  outdoors: { slug: 'outdoors', name: 'Outdoors', sort_order: 40 },
  water: { slug: 'water', name: 'Water & beach', sort_order: 50 },
  sports: { slug: 'sports_fitness', name: 'Sports & fitness', sort_order: 60 },
  events: { slug: 'events', name: 'Events', sort_order: 65 },
  wellness: { slug: 'wellness', name: 'Wellness', sort_order: 70 },
  music: { slug: 'music_dance', name: 'Music & dance', sort_order: 100 },
};

let seq = 0;
const row = (slug, name, parent, extra = {}) => ({ id: `id-${++seq}-${slug}`, slug, name, parent, kind: 'activity', sort_order: 10 * seq, ...extra });
const onb = (position) => ({ show_in_onboarding: true, onboarding_sort: position });

// Parents come back from the API too in some queries; they must never be selectable.
const parents = Object.values(P).map((parent) => ({ id: `parent-${parent.slug}`, slug: parent.slug, name: parent.name, parent: null, parent_id: null, kind: 'activity', sort_order: parent.sort_order }));

const CATALOGUE = [
  ...parents,
  row('dinner', 'Dinner', P.food),
  row('specialty_coffee', 'Specialty coffee', P.food, { kind: 'interest' }),
  row('vegan', 'Vegan / vegetarian', P.food, { kind: 'interest' }),
  row('food', 'Food', P.food, { kind: 'interest' }),
  row('cocktail_bar', 'Cocktail', P.drinks, onb(10)),
  row('wine_tasting', 'Wine', P.drinks, onb(20)),
  row('craft_beer', 'Beer', P.drinks, onb(30)),
  row('coffee', 'Coffee', P.drinks, onb(40)),
  row('detox_juice', 'Detox juice', P.drinks, onb(50)),
  row('karaoke', 'Karaoke', P.nightlife),
  row('hiking', 'Hiking', P.outdoors, onb(10)),
  row('city_walk', 'City walk', P.outdoors),
  row('rock_climbing', 'Rock climbing', P.outdoors, onb(20)),
  row('fishing', 'Fishing', P.outdoors, onb(30)),
  row('snorkeling', 'Snorkeling', P.water),
  row('scuba', 'Scuba diving', P.water, onb(20)),
  row('sailing', 'Sailing', P.water, onb(10)),
  // Catalogue order differs from onboarding order (Gym and Running come first in the full list).
  row('gym', 'Gym / workout', P.sports, onb(100)),
  row('running', 'Running', P.sports, onb(60)),
  row('swimming', 'Swimming', P.sports),
  row('yoga', 'Yoga', P.sports, onb(30)),
  row('tennis', 'Tennis', P.sports, onb(20)),
  row('badminton', 'Badminton', P.sports, onb(70)),
  row('pickleball', 'Pickleball', P.sports, onb(10)),
  row('padel', 'Padel', P.sports, onb(40)),
  row('golf', 'Golf', P.sports, onb(110)),
  row('basketball', 'Basketball', P.sports, onb(50)),
  row('football', 'Football', P.sports, onb(80)),
  row('soccer', 'Soccer', P.sports, onb(90)),
  row('volleyball', 'Volleyball', P.sports, onb(120)),
  row('sports_bar', 'Sports bar', P.sports),
  row('marathon', 'Marathons & races', P.sports, { kind: 'interest' }),
  row('sporting_events', 'Sporting events', P.events, onb(10)),
  row('music_festival', 'Music event / festival', P.events, onb(20)),
  row('skincare', 'Skincare / beauty', P.wellness, { kind: 'interest' }),
  row('concert', 'Concert', P.music),
  row('music', 'Music', P.music, { kind: 'interest' }),
];

const byId = (slug) => CATALOGUE.find((item) => item.slug === slug && item.parent).id;
const names = (groups) => groups.map((group) => [group.label, group.items.map((item) => item.name)]);

test('onboarding step 1 shows exactly the 24 flagged activities in five sections', () => {
  const groups = onboardingActivityGroups(CATALOGUE);
  assert.deepEqual(names(groups), [
    ['Drinks', ['Cocktail', 'Wine', 'Beer', 'Coffee', 'Detox juice']],
    ['Outdoors', ['Hiking', 'Rock climbing', 'Fishing']],
    ['Water & beach', ['Sailing', 'Scuba diving']],
    [
      'Sports & fitness',
      ['Pickleball', 'Tennis', 'Yoga', 'Padel', 'Basketball', 'Running', 'Badminton', 'Football', 'Soccer', 'Gym / workout', 'Golf', 'Volleyball'],
    ],
    ['Events', ['Sporting events', 'Music event / festival']],
  ]);
  assert.equal(groups.flatMap((group) => group.items).length, 24);
});

test('one pick in each onboarding section counts as 3 activities', () => {
  const picked = [byId('wine_tasting'), byId('tennis'), byId('music_festival')];
  assert.equal(countPicked(CATALOGUE, picked, 'activity'), 3);
  assert.equal(countPicked(CATALOGUE, picked, 'interest'), 0);
});

test('onboarding step 2 shows interests only, with no empty groups and no Drinks or Events', () => {
  const groups = onboardingInterestGroups(CATALOGUE);
  assert.deepEqual(names(groups), [
    ['Food', ['Specialty coffee', 'Vegan / vegetarian', 'Food']],
    ['Sports & fitness', ['Marathons & races']],
    ['Wellness', ['Skincare / beauty']],
    ['Music & dance', ['Music']],
  ]);
  assert.ok(groups.every((group) => group.items.length > 0));
  const activityNames = onboardingActivityGroups(CATALOGUE).flatMap((group) => group.items.map((item) => item.name));
  assert.ok(groups.flatMap((group) => group.items).every((item) => item.kind === 'interest' && !activityNames.includes(item.name)));
});

test('a parent is never offered or saved', () => {
  const all = catalogGroups(CATALOGUE, { kind: 'activity' }).flatMap((group) => group.items);
  assert.ok(all.every((item) => item.parent));
  assert.deepEqual(selectableIds(CATALOGUE, ['parent-sports_fitness', byId('yoga'), byId('yoga'), 'stale-id']), [byId('yoga')]);
});

test('search matches child names only', () => {
  assert.deepEqual(names(catalogGroups(CATALOGUE, { kind: 'activity', query: 'yoga' })), [['Sports & fitness', ['Yoga']]]);
  assert.deepEqual(names(catalogGroups(CATALOGUE, { kind: 'activity', query: 'soccer' })), [['Sports & fitness', ['Soccer']]]);
  // "sports" is in the parent's name, but only a child whose own name matches comes back.
  assert.deepEqual(names(catalogGroups(CATALOGUE, { kind: 'activity', query: 'sports' })), [['Sports & fitness', ['Sports bar']]]);
  assert.deepEqual(catalogGroups(CATALOGUE, { kind: 'activity', query: 'fitness' }), []);
});

test('Your activities comes first and those rows are not repeated under their parent', () => {
  const groups = catalogGroups(CATALOGUE, { kind: 'activity', mineIds: [byId('cocktail_bar'), byId('yoga')], yourLabel: 'Your activities' });
  assert.deepEqual(groups[0].label, 'Your activities');
  assert.deepEqual(groups[0].items.map((item) => item.name).sort(), ['Cocktail', 'Yoga']);
  const rest = groups.slice(1).flatMap((group) => group.items.map((item) => item.name));
  assert.ok(!rest.includes('Cocktail') && !rest.includes('Yoga'));
  assert.deepEqual(groups.slice(1).map((group) => group.label), ['Food', 'Drinks', 'Nightlife', 'Outdoors', 'Water & beach', 'Sports & fitness', 'Events', 'Music & dance']);
});

test('the Interests sheet has no Your activities group', () => {
  const groups = catalogGroups(CATALOGUE, { kind: 'interest', mineIds: [byId('cocktail_bar')], yourLabel: 'Your activities' });
  assert.ok(groups.every((group) => group.key !== 'mine'));
});
