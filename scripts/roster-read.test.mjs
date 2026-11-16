import test from 'node:test';
import assert from 'node:assert/strict';

const { runRosterRead, classifyRosterFailure, retryDelayMs, ROSTER_READ_CONFIG, RosterReadGaveUp, RosterReadCancelled } = await import(
  '../lib/rosterRead.ts'
);

/** A fake clock: sleep and slow attempts advance it instead of waiting. */
function clock() {
  let t = 0;
  return {
    now: () => t,
    advance: (ms) => {
      t += ms;
    },
    sleep: async (ms, signal) => {
      if (signal.aborted) throw new RosterReadCancelled();
      t += ms;
    },
    random: () => 0.5,
  };
}

/** What the parseRoster action returns for a provider status (as the server now sends it). */
const providerError = (status, retryAfterSeconds = null) => ({
  errors: [
    {
      extensions: {
        code: status === 429 ? 'ROSTER_PARSER_BUSY' : status >= 500 || status === 408 ? 'ROSTER_PARSER_TIMEOUT' : 'ROSTER_PARSER_UNAVAILABLE',
        retryable: [408, 429, 500, 502, 503, 504].includes(status),
        retryAfterSeconds,
      },
    },
  ],
});

function run(responses, { attemptMs = 2_000, signal = new AbortController().signal, c = clock() } = {}) {
  const events = [];
  let calls = 0;
  const promise = runRosterRead({
    signal,
    onEvent: (event) => events.push(event),
    deps: c,
    attempt: async () => {
      const next = responses[Math.min(calls, responses.length - 1)];
      calls += 1;
      c.advance(attemptMs);
      if (next === 'ok') return { trips: [1] };
      throw next;
    },
  });
  return { promise, events, calls: () => calls, clock: c };
}

test('one 503 then success: one retry ("Thinking…"), then the normal finish', async () => {
  const { promise, events, calls } = run([providerError(503), 'ok']);
  assert.deepEqual(await promise, { trips: [1] });
  assert.equal(calls(), 2);
  assert.equal(events.filter((e) => e.type === 'retrying').length, 1);
  assert.equal(events.at(-1).outcome, 'success');
});

test('repeated 502s keep retrying past 15s inside the 60s budget', async () => {
  const { promise, events } = run([providerError(502), providerError(502), providerError(502), 'ok'], { attemptMs: 6_000 });
  await promise;
  const finished = events.at(-1);
  assert.equal(finished.outcome, 'success');
  assert.ok(finished.elapsedMs > ROSTER_READ_CONFIG.slowAfterMs, 'the slow copy shows from 15s');
  assert.ok(finished.elapsedMs <= ROSTER_READ_CONFIG.budgetMs);
});

test('504s until the budget or retries run out: gave up ("Let\'s try this again later")', async () => {
  const { promise, events, calls } = run([providerError(504)], { attemptMs: 9_000 });
  await assert.rejects(promise, RosterReadGaveUp);
  assert.ok(calls() <= ROSTER_READ_CONFIG.maxRetries + 1);
  assert.equal(events.at(-1).outcome, 'gaveUp');
  assert.ok(events.at(-1).elapsedMs <= ROSTER_READ_CONFIG.budgetMs + 9_000);
});

test('max retries is honoured even with time left', async () => {
  const { promise, calls } = run([providerError(503)], { attemptMs: 10 });
  await assert.rejects(promise, RosterReadGaveUp);
  assert.equal(calls(), ROSTER_READ_CONFIG.maxRetries + 1);
});

test('a 400 or unreadable file fails at once, with no retries', async () => {
  for (const error of [providerError(400), { errors: [{ extensions: { code: 'ROSTER_PARSE_INVALID' } }] }]) {
    const { promise, calls } = run([error, 'ok']);
    await assert.rejects(promise, (thrown) => thrown === error);
    assert.equal(calls(), 1);
  }
});

test('Retry-After is honoured', () => {
  assert.equal(retryDelayMs(1, 5_000, ROSTER_READ_CONFIG, () => 0.5), 5_000);
  assert.equal(retryDelayMs(1, null, ROSTER_READ_CONFIG, () => 0.5), 1_000);
  assert.equal(retryDelayMs(4, null, ROSTER_READ_CONFIG, () => 0.5), 8_000);
  const jittered = [0, 1].map((r) => retryDelayMs(2, null, ROSTER_READ_CONFIG, () => r));
  assert.deepEqual(jittered, [1_500, 2_500]);
});

test('Cancel during retries stops every request and pending retry', async () => {
  const controller = new AbortController();
  const c = clock();
  let calls = 0;
  const promise = runRosterRead({
    signal: controller.signal,
    deps: {
      ...c,
      sleep: async (ms, signal) => {
        controller.abort(); // the user taps Cancel import while waiting to retry
        if (signal.aborted) throw new RosterReadCancelled();
      },
    },
    attempt: async () => {
      calls += 1;
      throw providerError(503);
    },
  });
  await assert.rejects(promise, RosterReadCancelled);
  assert.equal(calls, 1);
});

test('Cancel aborts the in-flight request', async () => {
  const controller = new AbortController();
  let attemptSignal;
  const promise = runRosterRead({
    signal: controller.signal,
    attempt: (index, signal) =>
      new Promise((resolve, reject) => {
        attemptSignal = signal;
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  });
  controller.abort();
  await assert.rejects(promise, RosterReadCancelled);
  assert.equal(attemptSignal.aborted, true);
});

test('network failures and older retryable codes are retryable; consent and bad files are not', () => {
  assert.equal(classifyRosterFailure(new TypeError('Network request failed')).retryable, true);
  assert.equal(classifyRosterFailure({ errors: [{ extensions: { code: 'ROSTER_PARSER_BUSY' } }] }).retryable, true);
  assert.equal(classifyRosterFailure({ statusCode: 502 }).retryable, true);
  assert.equal(classifyRosterFailure({ statusCode: 413 }).retryable, false);
  assert.equal(classifyRosterFailure({ errors: [{ extensions: { code: 'ROSTER_CONSENT_REQUIRED' } }] }).retryable, false);
});
