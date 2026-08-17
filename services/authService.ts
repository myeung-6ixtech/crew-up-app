import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { nhost } from '@/lib/nhost';

WebBrowser.maybeCompleteAuthSession();

function getOAuthRedirectUrl() {
  const fromLinking = Linking.createURL('/');
  if (fromLinking) return fromLinking;
  const scheme = process.env.EXPO_PUBLIC_APP_SCHEME ?? 'crewup';
  return `${scheme}://`;
}

function extractRefreshToken(url: string): string | null {
  const parsed = Linking.parse(url);
  const fromQuery = parsed.queryParams?.refreshToken;
  if (typeof fromQuery === 'string' && fromQuery.length > 0) {
    return decodeURIComponent(fromQuery);
  }
  const hashMatch = url.match(/[#&?]refreshToken=([^&]+)/);
  if (hashMatch?.[1]) {
    return decodeURIComponent(hashMatch[1]);
  }
  return null;
}

export async function signInWithGoogle() {
  const redirectTo = getOAuthRedirectUrl();
  const authUrl = nhost.auth.signInProviderURL('google', { redirectTo });

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo, {
    preferEphemeralSession: true,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Google sign-in was cancelled');
  }

  if (result.type !== 'success') {
    throw new Error('Google sign-in failed');
  }

  const refreshToken = extractRefreshToken(result.url);
  if (!refreshToken) {
    throw new Error('No session returned from Google sign-in');
  }

  await nhost.auth.refreshToken({ refreshToken });
  await nhost.refreshSession(0);
}

export async function signIn(email: string, password: string) {
  const result = await nhost.auth.signInEmailPassword({ email, password });
  await nhost.refreshSession(0);
  return result.body;
}

export async function signUp(email: string, password: string) {
  const result = await nhost.auth.signUpEmailPassword({
    email,
    password,
    options: { allowedRoles: ['user', 'me'] },
  });
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
