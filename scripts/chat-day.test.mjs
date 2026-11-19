import test from 'node:test';
import assert from 'node:assert/strict';

process.env.TZ = 'Asia/Hong_Kong';
const { dayLabel, withDayDividers } = await import('../lib/chatDay.ts');

const labels = { today: 'Today', yesterday: 'Yesterday' };
const now = new Date('2026-11-19T10:00:00+08:00');

test('Today, Yesterday, weekday within a week, then a date', () => {
  assert.equal(dayLabel('2026-11-19T00:30:00+08:00', labels, now), 'Today');
  assert.equal(dayLabel('2026-11-18T23:59:00+08:00', labels, now), 'Yesterday');
  assert.equal(dayLabel('2026-11-16T12:00:00+08:00', labels, now), 'Monday');
  assert.equal(dayLabel('2026-11-10T12:00:00+08:00', labels, now), 'Tue 10 Nov');
  assert.equal(dayLabel('2025-12-31T12:00:00+08:00', labels, now), 'Wed 31 Dec 2025');
});

test('a divider above the first message of each day (inverted list)', () => {
  const newestFirst = [
    { id: 'c', created_at: '2026-11-19T09:00:00+08:00' },
    { id: 'b', created_at: '2026-11-19T08:00:00+08:00' },
    { id: 'a', created_at: '2026-11-17T20:00:00+08:00' },
  ];
  assert.deepEqual(
    withDayDividers(newestFirst).map((row) => row.id),
    ['c', 'b', 'day:2026-11-19', 'a', 'day:2026-11-17'],
  );
});
