/** Matches `passwordMinLength` in crew-up-nhost/nhost/nhost.toml. */
export const PASSWORD_MIN_LENGTH = 9;

export type PasswordIssue = 'short' | 'weak';

/** Length plus mixed case, a number, and a symbol. */
export function passwordIssue(password: string): PasswordIssue | null {
  if (password.length < PASSWORD_MIN_LENGTH) return 'short';
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) return 'weak';
  return null;
}
