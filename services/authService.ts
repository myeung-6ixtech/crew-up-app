import { nhost } from '@/lib/nhost';

export async function signIn(email: string, password: string) {
  const result = await nhost.auth.signInEmailPassword({ email, password });
  await nhost.refreshSession(0);
  return result.body;
}

export async function signUp(email: string, password: string) {
  const result = await nhost.auth.signUpEmailPassword({ email, password });
  await nhost.refreshSession(0);
  return result.body;
}

export async function sendPasswordResetEmail(email: string) {
  const redirectTo = `${process.env.EXPO_PUBLIC_APP_SCHEME ?? 'crewup'}://reset-password`;
  return nhost.auth.sendPasswordResetEmail({ email, options: { redirectTo } });
}

export async function resetPassword(newPassword: string, ticket: string) {
  return nhost.auth.changeUserPassword({ newPassword, ticket });
}

export async function changePassword(newPassword: string) {
  return nhost.auth.changeUserPassword({ newPassword });
}
