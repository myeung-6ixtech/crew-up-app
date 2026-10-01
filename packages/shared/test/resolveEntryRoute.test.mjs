import test from 'node:test';
import assert from 'node:assert/strict';

const { resolveEntryRoute } = await import('../src/onboarding/resolveEntryRoute.ts');
const { nextStep, previousStep } = await import('../src/onboarding/steps.ts');

const AT = '2026-09-01T00:00:00Z';
const state = (overrides = {}) => ({
  currentStep: null,
  betaSignupCompletedAt: null,
  onboardingCompletedAt: null,
  ...overrides,
});

// §3.1 row 1: beta, null, null -> beta sign-up (resume)
test('beta + no timestamps resumes beta sign-up at the saved step', () => {
  assert.deepEqual(resolveEntryRoute('beta', null), { kind: 'onboarding', variant: 'beta', step: 'name_handle' });
  assert.deepEqual(resolveEntryRoute('beta', state({ currentStep: 'residence' })), {
    kind: 'onboarding',
    variant: 'beta',
    step: 'residence',
  });
  assert.deepEqual(resolveEntryRoute('beta', state({ currentStep: 'beta_notify' })), {
    kind: 'onboarding',
    variant: 'beta',
    step: 'beta_notify',
  });
});

// §3.1 row 2: beta, set, null -> beta holding
test('beta + beta sign-up done lands on the holding screen', () => {
  assert.deepEqual(resolveEntryRoute('beta', state({ betaSignupCompletedAt: AT })), { kind: 'beta_holding' });
});

// §3.1 row 3: beta, any, set -> main app
test('beta + onboarding completed goes to the main app', () => {
  assert.deepEqual(resolveEntryRoute('beta', state({ onboardingCompletedAt: AT })), { kind: 'main' });
  assert.deepEqual(
    resolveEntryRoute('beta', state({ betaSignupCompletedAt: AT, onboardingCompletedAt: AT })),
    { kind: 'main' },
  );
});

// §3.1 row 4: launched, null, null -> standard onboarding (fresh)
test('launched + no timestamps starts or resumes standard onboarding', () => {
  assert.deepEqual(resolveEntryRoute('launched', null), {
    kind: 'onboarding',
    variant: 'fresh',
    step: 'name_handle',
  });
  assert.deepEqual(resolveEntryRoute('launched', state({ currentStep: 'launch_guidelines' })), {
    kind: 'onboarding',
    variant: 'fresh',
    step: 'launch_guidelines',
  });
});

// §3.1 row 5: launched, set, null -> standard onboarding (pre-filled from beta), opens on Review
test('launched + beta sign-up done opens pre-filled on review', () => {
  assert.deepEqual(resolveEntryRoute('launched', state({ betaSignupCompletedAt: AT, currentStep: 'beta_notify' })), {
    kind: 'onboarding',
    variant: 'prefilled_from_beta',
    step: 'review',
  });
  assert.deepEqual(
    resolveEntryRoute('launched', state({ betaSignupCompletedAt: AT, currentStep: 'launch_notifications' })),
    { kind: 'onboarding', variant: 'prefilled_from_beta', step: 'launch_notifications' },
  );
});

// §3.1 row 6: launched, any, set -> main app, onboarding never shown again
test('launched + onboarding completed goes to the main app', () => {
  assert.deepEqual(resolveEntryRoute('launched', state({ onboardingCompletedAt: AT })), { kind: 'main' });
  assert.deepEqual(
    resolveEntryRoute('launched', state({ betaSignupCompletedAt: AT, onboardingCompletedAt: AT, currentStep: 'about' })),
    { kind: 'main' },
  );
});

test('unknown mode never defaults to launched', () => {
  assert.deepEqual(resolveEntryRoute(null, null), { kind: 'mode_unavailable' });
  assert.deepEqual(resolveEntryRoute(null, state({ onboardingCompletedAt: AT })), { kind: 'main' });
});

test('mode flips clamp steps that belong to the other ending', () => {
  assert.equal(resolveEntryRoute('beta', state({ currentStep: 'launch_privacy' })).step, 'review');
  assert.equal(resolveEntryRoute('launched', state({ currentStep: 'beta_notify' })).step, 'review');
  assert.equal(resolveEntryRoute('launched', state({ currentStep: 'bogus' })).step, 'name_handle');
});

test('step sequence per mode', () => {
  assert.equal(nextStep('beta', 'review'), 'beta_notify');
  assert.equal(nextStep('beta', 'beta_notify'), null);
  assert.equal(nextStep('launched', 'review'), 'launch_privacy');
  assert.equal(nextStep('launched', 'launch_notifications'), null);
  assert.equal(previousStep('launched', 'name_handle'), null);
  assert.equal(previousStep('launched', 'about'), 'name_handle');
});
