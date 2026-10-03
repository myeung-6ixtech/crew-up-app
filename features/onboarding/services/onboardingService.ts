import { GUIDELINES_VERSION, NameHandlePatchSchema, NameHandleSchema, type OnboardingStep } from '@crewup/shared';
import { apiEndpoints } from '@/lib/api/endpoints';
import { nhost } from '@/lib/nhost';
import type { Profile } from '@/types/domain';

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

const OTHER_NAME_FIELDS = new Set(['fullName', 'fullNameNative', 'username']);

/**
 * Saves the name other crew see. Sends only preferredName when the step endpoint
 * accepts a patch. If it still requires the rest of the name, resends the stored
 * full name and username unchanged so the display name can update.
 */
export async function savePreferredName(
  preferredName: string,
  profile: Pick<Profile, 'full_name' | 'full_name_native' | 'username'> | null | undefined,
  options: { advance: boolean },
): Promise<void> {
  const patch = NameHandlePatchSchema.safeParse({ preferredName });
  if (!patch.success) {
    throw new OnboardingRequestError(422, 'ONBOARDING_INVALID_STEP', patch.error.issues[0]?.message ?? 'Invalid name', {
      preferredName: patch.error.issues[0]?.message ?? 'Invalid name',
    });
  }

  const stored = NameHandleSchema.safeParse({
    fullName: profile?.full_name ?? '',
    fullNameNative: profile?.full_name_native ?? null,
    preferredName,
    username: profile?.username ?? '',
  });

  try {
    await saveStep('name_handle', patch.data, options);
  } catch (error) {
    const fields = error instanceof OnboardingRequestError ? error.fields : {};
    const preferredNameProblem = Object.keys(fields).some(
      (field) => field === 'preferredName' || field.startsWith('preferredName.'),
    );
    const needsStoredName =
      error instanceof OnboardingRequestError &&
      stored.success &&
      !preferredNameProblem &&
      (error.status === 422 || Object.keys(fields).some((field) => OTHER_NAME_FIELDS.has(field)));
    if (!needsStoredName) throw error;
    await saveStep('name_handle', stored.data, options);
  }
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
