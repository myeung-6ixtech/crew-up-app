import test from 'node:test';
import assert from 'node:assert/strict';

// The device zone is deliberately not any airport's: times must still come out in each airport's own zone.
process.env.TZ = 'America/New_York';

const { upcomingLayovers, summarizeLayovers, formatDuration } = await import('../lib/layovers.ts');
const { formatZoneTimeWithLabel, zoneDayOffset } = await import('../lib/timeZone.ts');
const { AIRPORTS } = await import('../constants/airports.ts');

const zone = (iata) => AIRPORTS.find((airport) => airport.iata === iata)?.timeZone ?? 'UTC';
const NOW = Date.parse('2026-10-01T00:00:00Z');

const trip = (id, { flight, stays = [] } = {}) => ({
  id,
  flightLegs: flight ? [{ id: `${id}-leg`, flight: { id: `${id}-f`, ...flight } }] : [],
  stays: stays.map((stay, index) => ({ id: `${id}-stay${index}`, ...stay })),
});

const trips = [
  trip('a', {
    flight: { flight_number: 'EK318', departure_airport: 'DXB', arrival_airport: 'NRT', scheduled_departure: '2026-10-13T22:55:00Z', scheduled_arrival: '2026-10-14T08:35:00Z' },
    stays: [{ city: 'TOKYO', airport_iata: 'NRT', starts_at: '2026-10-14T08:35:00Z', ends_at: '2026-10-15T13:30:00Z' }],
  }),
  trip('b', {
    flight: { flight_number: 'EK1', departure_airport: 'DXB', arrival_airport: 'LHR', scheduled_departure: '2026-10-20T03:00:00Z', scheduled_arrival: '2026-10-20T07:00:00Z' },
    stays: [{ city: 'LONDON', airport_iata: 'LHR', starts_at: '2026-10-20T07:00:00Z', ends_at: '2026-10-20T15:00:00Z' }],
  }),
  // Already over: not upcoming.
  trip('old', {
    stays: [{ city: 'PARIS', airport_iata: 'CDG', starts_at: '2026-09-01T07:00:00Z', ends_at: '2026-09-02T07:00:00Z' }],
  }),
];

test('total free time is the sum of upcoming layovers; Longest is the max', () => {
  const layovers = upcomingLayovers(trips, { nowMs: NOW });
  assert.deepEqual(layovers.map((l) => l.city), ['TOKYO', 'LONDON']);
  const summary = summarizeLayovers(layovers);
  assert.equal(summary.count, 2);
  assert.equal(summary.totalMinutes, layovers.reduce((sum, l) => sum + l.minutes, 0));
  assert.equal(summary.totalMinutes, 28 * 60 + 55 + 8 * 60);
  assert.equal(summary.longest.city, 'TOKYO');
  assert.equal(formatDuration(summary.totalMinutes), '36h 55m');
});

test('removing a trip removes its layover and updates the totals', () => {
  const after = summarizeLayovers(upcomingLayovers(trips.filter((t) => t.id !== 'a'), { nowMs: NOW }));
  assert.equal(after.count, 1);
  assert.equal(after.totalMinutes, 8 * 60);
  assert.equal(after.longest.city, 'LONDON');
});

test('durations: "8h 00m", "28h 55m", minutes only under an hour (a short connection)', () => {
  assert.equal(formatDuration(480), '8h 00m');
  assert.equal(formatDuration(28 * 60 + 55), '28h 55m');
  assert.equal(formatDuration(45), '45m');
  const connection = upcomingLayovers(
    [trip('c', { stays: [{ city: 'DOHA', airport_iata: 'DOH', starts_at: '2026-10-05T10:00:00Z', ends_at: '2026-10-05T10:45:00Z' }] })],
    { nowMs: NOW },
  );
  assert.equal(connection[0].short, true);
});

test('no saved stay: the layover is the gap to the next departure from the same airport', () => {
  const layovers = upcomingLayovers(
    [
      trip('out', { flight: { flight_number: 'CX1', departure_airport: 'HKG', arrival_airport: 'SIN', scheduled_departure: '2026-10-03T01:00:00Z', scheduled_arrival: '2026-10-03T05:00:00Z' } }),
      trip('back', { flight: { flight_number: 'CX2', departure_airport: 'SIN', arrival_airport: 'HKG', scheduled_departure: '2026-10-04T05:30:00Z', scheduled_arrival: '2026-10-04T09:30:00Z' } }),
    ],
    { nowMs: NOW },
  );
  assert.equal(layovers.length, 1);
  assert.equal(layovers[0].airportIata, 'SIN');
  assert.equal(layovers[0].derived, true);
  assert.equal(formatDuration(layovers[0].minutes), '24h 30m');
});

test('a next-day arrival is +1 in local time', () => {
  // EK318 leaves Dubai 02:55 on the 14th and lands in Tokyo 17:35 the same local day…
  assert.equal(zoneDayOffset('2026-10-13T22:55:00Z', zone('DXB'), '2026-10-14T08:35:00Z', zone('NRT')), 0);
  // …CX251 leaves Hong Kong 21:45 and lands in London 05:25 the next local day.
  assert.equal(zoneDayOffset('2026-12-18T13:45:00Z', zone('HKG'), '2026-12-19T05:25:00Z', zone('LHR')), 1);
});

test("times render in each airport's zone, not the device's (device is New York)", () => {
  assert.equal(new Date('2026-10-13T22:55:00Z').getHours(), 18); // the device's own clock, to prove the zone is set
  assert.match(formatZoneTimeWithLabel('2026-10-13T22:55:00Z', zone('DXB')), /^2:55 AM GMT\+4$/);
  assert.match(formatZoneTimeWithLabel('2026-10-14T08:35:00Z', zone('NRT')), /^5:35 PM GMT\+9$/);
});
