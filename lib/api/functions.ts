import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';

/** A failed `/client/...` function call: the server's `error.code`, message and any extra fields. */
export class FunctionError extends Error {
  readonly code: string;
  readonly status: number;
  readonly extra: Record<string, unknown>;

  constructor(code: string, message: string, status: number, extra: Record<string, unknown> = {}) {
    super(message);
    this.name = 'FunctionError';
    this.code = code;
    this.status = status;
    this.extra = extra;
  }
}

/** Calls an Nhost function under `/client/` with the signed-in user's token. */
export async function callClientFunction<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: Record<string, unknown> } = {},
): Promise<T> {
  const session = await nhost.refreshSession(60);
  if (!session?.accessToken) throw new FunctionError('UNAUTHORIZED', 'Not authenticated', 401);
  const method = options.method ?? 'POST';
  const response = await fetch(`${apiEndpoints.functions}/client/${path}`, {
    method,
    headers: { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(options.body ?? {}) : undefined,
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: { code?: string; message?: string } & Record<string, unknown> };
  if (!response.ok) {
    const { code, message, ...extra } = payload.error ?? {};
    throw new FunctionError(code ?? 'UNKNOWN', message ?? 'Something went wrong', response.status, extra);
  }
  return payload as T;
}
