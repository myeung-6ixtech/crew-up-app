/**
 * Retry loop for reading a roster (upload → parseRoster). Dependency-free so the policy can be unit-tested with a
 * mocked provider (scripts/roster-read.test.mjs).
 *
 * Busy or flaky provider answers (429, 408, 5xx, timeouts, dropped connections) are retried with exponential backoff
 * and jitter, honouring Retry-After, inside one total budget measured from the start of the read. Anything else
 * (a bad or unreadable file, no roster found, consent) ends the read at once. Cancel aborts the in-flight request and
 * every pending retry. Status codes and retry counts go to logs only; the user never sees them.
 */

export const ROSTER_READ_CONFIG = {
  /** "Taking longer than expected" from this long after the read started, while there's still no result. */
  slowAfterMs: 15_000,
  /** Total time for every attempt and wait together. After this the reader is "busy, try later". */
  budgetMs: 60_000,
  /** Retries after the first attempt. */
  maxRetries: 4,
  /** Backoff before retry 1, 2, 3, 4 (about 1s, 2s, 4s, 8s), each with ±25% jitter. */
  backoffMs: [1_000, 2_000, 4_000, 8_000],
} as const;

export type RosterReadConfig = {
  slowAfterMs: number;
  budgetMs: number;
  maxRetries: number;
  backoffMs: readonly number[];
};

export type Classified = { retryable: boolean; retryAfterMs: number | null; status: number | null; code: string | null };

export type RosterReadEvent =
  | { type: 'attempt'; attempt: number; elapsedMs: number }
  | { type: 'retrying'; attempt: number; status: number | null; code: string | null; delayMs: number; elapsedMs: number }
  | { type: 'finished'; outcome: 'success' | 'failed' | 'gaveUp' | 'cancelled'; attempts: number; elapsedMs: number; status: number | null };

/** The provider stayed busy past the retries or the budget. The UI shows "Let's try this again later". */
export class RosterReadGaveUp extends Error {
  readonly attempts: number;
  readonly lastStatus: number | null;

  constructor(attempts: number, lastStatus: number | null) {
    super('Roster reader stayed busy');
    this.name = 'RosterReadGaveUp';
    this.attempts = attempts;
    this.lastStatus = lastStatus;
  }
}

export class RosterReadCancelled extends Error {
  constructor() {
    super('Roster read cancelled');
    this.name = 'RosterReadCancelled';
  }
}

/** Codes the server marks as busy or timed out. Older function builds don't send `retryable`, so these count too. */
const RETRYABLE_CODES = new Set(['ROSTER_PARSER_BUSY', 'ROSTER_PARSER_TIMEOUT']);
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Reads a failure from the action (Apollo GraphQL error with extensions), the HTTP layer (status), or the network.
 * Kept structural so it works without importing Apollo.
 */
export function classifyRosterFailure(error: unknown): Classified {
  const any = error as {
    errors?: { extensions?: Record<string, unknown> }[];
    graphQLErrors?: { extensions?: Record<string, unknown> }[];
    statusCode?: number;
    status?: number;
    name?: string;
    message?: string;
  } | null;
  const extensions = (any?.errors ?? any?.graphQLErrors)?.[0]?.extensions;
  if (extensions) {
    const code = typeof extensions.code === 'string' ? extensions.code : null;
    const retryAfter = typeof extensions.retryAfterSeconds === 'number' ? extensions.retryAfterSeconds * 1000 : null;
    const retryable = extensions.retryable === true || (code !== null && RETRYABLE_CODES.has(code));
    return { retryable, retryAfterMs: retryAfter, status: null, code };
  }
  const status = typeof any?.statusCode === 'number' ? any.statusCode : typeof any?.status === 'number' ? any.status : null;
  if (status !== null) return { retryable: RETRYABLE_STATUSES.has(status), retryAfterMs: null, status, code: null };
  // No GraphQL error and no status: the request never got an answer (offline, timeout, dropped connection).
  const network = any?.name === 'TypeError' || /network|timed? ?out|fetch failed|connection/i.test(any?.message ?? '');
  return { retryable: network, retryAfterMs: null, status: null, code: null };
}

/** Backoff for a retry (1-based), with ±25% jitter, at least Retry-After when the provider sent one. */
export function retryDelayMs(retry: number, retryAfterMs: number | null, config: RosterReadConfig, random: () => number): number {
  const base = config.backoffMs[Math.min(retry - 1, config.backoffMs.length - 1)] ?? 1_000;
  const jittered = Math.round(base * (0.75 + random() * 0.5));
  return Math.max(jittered, retryAfterMs ?? 0);
}

type Deps = {
  now: () => number;
  sleep: (ms: number, signal: AbortSignal) => Promise<void>;
  random: () => number;
};

const realDeps: Deps = {
  now: () => Date.now(),
  random: Math.random,
  sleep: (ms, signal) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new RosterReadCancelled());
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new RosterReadCancelled());
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }),
};

/**
 * Runs `attempt` until it succeeds, fails for good, runs out of retries or budget, or `signal` aborts.
 * Each attempt gets its own AbortSignal that also fires when the budget ends, so a stuck request can't hold the read.
 */
export async function runRosterRead<T>({
  attempt,
  signal,
  onEvent,
  config = ROSTER_READ_CONFIG,
  classify = classifyRosterFailure,
  deps = realDeps,
}: {
  attempt: (index: number, signal: AbortSignal, elapsedMs: number) => Promise<T>;
  signal: AbortSignal;
  onEvent?: (event: RosterReadEvent) => void;
  config?: RosterReadConfig;
  classify?: (error: unknown) => Classified;
  deps?: Partial<Deps>;
}): Promise<T> {
  const { now, sleep, random } = { ...realDeps, ...deps };
  const startedAt = now();
  const elapsed = () => now() - startedAt;
  let attempts = 0;
  let lastStatus: number | null = null;
  const finish = (outcome: 'success' | 'failed' | 'gaveUp' | 'cancelled') =>
    onEvent?.({ type: 'finished', outcome, attempts, elapsedMs: elapsed(), status: lastStatus });

  for (let index = 0; ; index += 1) {
    if (signal.aborted) {
      finish('cancelled');
      throw new RosterReadCancelled();
    }
    const remaining = config.budgetMs - elapsed();
    if (remaining <= 0) {
      finish('gaveUp');
      throw new RosterReadGaveUp(attempts, lastStatus);
    }

    // This attempt stops on Cancel or when the budget runs out, whichever comes first.
    const controller = new AbortController();
    const onCancel = () => controller.abort();
    signal.addEventListener('abort', onCancel, { once: true });
    const budgetTimer = setTimeout(() => controller.abort(), remaining);
    attempts += 1;
    onEvent?.({ type: 'attempt', attempt: index, elapsedMs: elapsed() });
    try {
      const result = await attempt(index, controller.signal, elapsed());
      finish('success');
      return result;
    } catch (error) {
      if (signal.aborted) {
        finish('cancelled');
        throw new RosterReadCancelled();
      }
      const info = controller.signal.aborted
        ? { retryable: true, retryAfterMs: null, status: 408, code: null } // the budget cut this attempt short
        : classify(error);
      lastStatus = info.status ?? lastStatus;
      if (!info.retryable) {
        finish('failed');
        throw error;
      }
      const retry = index + 1;
      const delay = retryDelayMs(retry, info.retryAfterMs, config, random);
      if (retry > config.maxRetries || elapsed() + delay >= config.budgetMs) {
        finish('gaveUp');
        throw new RosterReadGaveUp(attempts, lastStatus);
      }
      onEvent?.({ type: 'retrying', attempt: retry, status: info.status, code: info.code, delayMs: delay, elapsedMs: elapsed() });
      try {
        await sleep(delay, signal);
      } catch {
        finish('cancelled');
        throw new RosterReadCancelled();
      }
    } finally {
      clearTimeout(budgetTimer);
      signal.removeEventListener('abort', onCancel);
    }
  }
}
