import { GUIDELINES_VERSION, type OnboardingStep } from '@crewup/shared';
import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';

/** Error body shared by the onboarding Functions: `{ error: { code, message, fields? } }`. */
export class OnboardingRequestError extends Error {
  readonly code: string;
  readonly fields: Record<string, string>;
  readonly status: number;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'OnboardingRequestError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export type OnboardingStateResponse = {
  currentStep: OnboardingStep | null;
  flowVersion: number;
  betaSignupCompletedAt: string | null;
  onboardingCompletedAt: string | null;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await nhost.refreshSession(60);
  if (!session?.accessToken) {
    throw new OnboardingRequestError(401, 'UNAUTHORIZED', 'Not signed in');
  }
  const response = await fetch(`${apiEndpoints.functions}/client/onboarding/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string; fields?: Record<string, string> } })
      ?.error;
    throw new OnboardingRequestError(
      response.status,
      error?.code ?? 'ONBOARDING_FAILED',
      error?.message ?? 'Something went wrong. Try again.',
      error?.fields,
    );
  }
  return payload as T;
}

export function saveStep(
  step: OnboardingStep,
  data: Record<string, unknown>,
  options: { advance: boolean },
): Promise<{ step: OnboardingStep; state: OnboardingStateResponse }> {
  return request('step', {
    method: 'PUT',
    body: JSON.stringify({ step, data, advance: options.advance }),
  });
}

export type UsernameAvailability =
  | { available: true; username: string }
  | { available: false; reason: 'invalid' | 'reserved' | 'taken'; message: string };

export function checkUsername(username: string, signal?: AbortSignal): Promise<UsernameAvailability> {
  return request(`username-available?u=${encodeURIComponent(username)}`, { method: 'GET', signal });
}

export function completeBetaSignup(): Promise<{ state: OnboardingStateResponse }> {
  return request('beta-complete', { method: 'POST', body: '{}' });
}

export function completeOnboarding(): Promise<{ state: OnboardingStateResponse }> {
  return request('complete', {
    method: 'POST',
    body: JSON.stringify({ guidelinesVersion: GUIDELINES_VERSION }),
  });
}
