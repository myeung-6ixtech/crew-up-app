import test from 'node:test';
import assert from 'node:assert/strict';

const {
  formatZoneDate,
  formatZoneTime,
  resolveTimeZone,
  utcToWallClock,
  wallClockToUtc,
  zoneDateKey,
  zoneDayOffset,
} = await import('../lib/timeZone.ts');

test('unknown or unsupported zones fall back to UTC', () => {
  assert.equal(resolveTimeZone('Asia/Hong_Kong'), 'Asia/Hong_Kong');
  assert.equal(resolveTimeZone('Not/AZone'), 'UTC');
  assert.equal(resolveTimeZone(null), 'UTC');
  assert.equal(resolveTimeZone(undefined), 'UTC');
});

test('an instant maps to the right local calendar day per zone', () => {
  // 16:30Z on 20 Sep is already 21 Sep in Hong Kong but still 20 Sep in London.
  const instant = '2026-09-20T16:30:00.000Z';
  assert.equal(zoneDateKey(instant, 'Asia/Hong_Kong'), '2026-09-21');
  assert.equal(zoneDateKey(instant, 'Europe/London'), '2026-09-20');
  assert.equal(zoneDateKey(instant, 'America/Los_Angeles'), '2026-09-20');
});

test('trans-Pacific flights crossing the date line arrive the previous local day', () => {
  // Departs HKG 00:50 local on 21 Sep (16:50Z on 20 Sep), lands LAX 21:25 local
  // on 20 Sep (04:25Z on 21 Sep).
  const offset = zoneDayOffset(
    '2026-09-20T16:50:00.000Z',
    'Asia/Hong_Kong',
    '2026-09-21T04:25:00.000Z',
    'America/Los_Angeles',
  );
  assert.equal(offset, -1);
});

test('long-haul westbound flights arrive the next local day', () => {
  const offset = zoneDayOffset(
    '2026-09-21T16:00:00.000Z',
    'Europe/London',
    '2026-09-22T11:30:00.000Z',
    'Asia/Hong_Kong',
  );
  assert.equal(offset, 1);
});

test('same-day short-haul flights report no day shift', () => {
  const offset = zoneDayOffset(
    '2026-09-21T02:00:00.000Z',
    'Asia/Hong_Kong',
    '2026-09-21T06:00:00.000Z',
    'Asia/Tokyo',
  );
  assert.equal(offset, 0);
});

test('missing instants never produce a spurious day shift', () => {
  assert.equal(zoneDayOffset(null, 'Asia/Hong_Kong', null, 'Europe/London'), 0);
  assert.equal(zoneDayOffset('not-a-date', 'Asia/Hong_Kong', null, 'Europe/London'), 0);
  assert.equal(zoneDateKey('not-a-date', 'Asia/Hong_Kong'), null);
});

test('wall-clock input converts to UTC using the zone offset', () => {
  // 21 Sep 2026 10:00 in Hong Kong (UTC+8) is 02:00Z.
  const local = new Date(2026, 8, 21, 10, 0, 0, 0);
  assert.equal(wallClockToUtc(local, 'Asia/Hong_Kong').toISOString(), '2026-09-21T02:00:00.000Z');
});

test('conversion honours daylight saving on both sides of a transition', () => {
  // London is UTC+1 in summer and UTC+0 after the last Sunday of October 2026.
  const summer = new Date(2026, 6, 15, 12, 0, 0, 0);
  const winter = new Date(2026, 11, 15, 12, 0, 0, 0);
  assert.equal(wallClockToUtc(summer, 'Europe/London').toISOString(), '2026-07-15T11:00:00.000Z');
  assert.equal(wallClockToUtc(winter, 'Europe/London').toISOString(), '2026-12-15T12:00:00.000Z');

  // New York: UTC-4 in July, UTC-5 in December.
  assert.equal(
    wallClockToUtc(summer, 'America/New_York').toISOString(),
    '2026-07-15T16:00:00.000Z',
  );
  assert.equal(
    wallClockToUtc(winter, 'America/New_York').toISOString(),
    '2026-12-15T17:00:00.000Z',
  );
});

test('an unsupported zone converts as UTC rather than throwing', () => {
  const local = new Date(2026, 8, 21, 10, 0, 0, 0);
  assert.equal(wallClockToUtc(local, 'Not/AZone').toISOString(), '2026-09-21T10:00:00.000Z');
});

test('UTC and wall-clock conversions round trip', () => {
  for (const zone of ['Asia/Hong_Kong', 'Europe/London', 'America/Los_Angeles', 'Australia/Sydney']) {
    for (const iso of ['2026-03-29T01:30:00.000Z', '2026-09-21T02:00:00.000Z', '2026-12-15T23:45:00.000Z']) {
      const wallClock = utcToWallClock(iso, zone);
      assert.ok(wallClock, `${zone} ${iso}`);
      assert.equal(wallClockToUtc(wallClock, zone).toISOString(), iso, `${zone} ${iso}`);
    }
  }
});

test('formatters render in the requested zone and degrade on bad input', () => {
  const instant = '2026-09-21T02:00:00.000Z';
  const hongKong = formatZoneTime(instant, 'Asia/Hong_Kong');
  const london = formatZoneTime(instant, 'Europe/London');
  assert.notEqual(hongKong, london, 'the same instant reads differently in each zone');
  assert.match(hongKong, /10/, 'Hong Kong is UTC+8 so 02:00Z is 10:00');

  assert.equal(formatZoneTime(null, 'Asia/Hong_Kong'), '—');
  assert.equal(formatZoneDate(undefined, 'Asia/Hong_Kong'), '—');
  assert.equal(formatZoneTime('not-a-date', 'Asia/Hong_Kong'), '—');
});
