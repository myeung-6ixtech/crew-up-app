/** Matches `passwordMinLength` in crew-up-nhost/nhost/nhost.toml. Nhost only checks length and breaches; the rest are app rules. */
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRuleKey = 'length' | 'case' | 'number' | 'symbol' | 'personal';

export type PasswordRule = { key: PasswordRuleKey; ok: boolean; meta?: string };

/** Lowercased pieces of the user's name or email a password mustn't contain. Pieces of two letters or fewer are ignored. */
export function personalTokens(...values: (string | null | undefined)[]) {
  return values
    .flatMap((value) => (value ?? '').toLowerCase().split('@')[0].split(/[^a-z0-9]+/))
    .filter((token) => token.length > 2);
}

/** The five rules shown live under a new password. */
export function passwordRules(password: string, personal: string[]): PasswordRule[] {
  const lower = password.toLowerCase();
  return [
    { key: 'length', ok: password.length >= PASSWORD_MIN_LENGTH, meta: `${password.length}/${PASSWORD_MIN_LENGTH}` },
    { key: 'case', ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { key: 'number', ok: /\d/.test(password) },
    { key: 'symbol', ok: /[^A-Za-z0-9\s]/.test(password) },
    { key: 'personal', ok: password.length > 0 && !personal.some((token) => lower.includes(token)) },
  ];
}

/** 0 empty, 1 weak, 2 fair, 3 good, 4 strong (every rule passes). */
export function passwordScore(password: string, rules: PasswordRule[]): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  const passed = rules.filter((rule) => rule.ok).length;
  if (passed === rules.length) return 4;
  return passed >= 4 ? 3 : passed >= 2 ? 2 : 1;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
