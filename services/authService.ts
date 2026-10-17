import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
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

/** iOS only. Apple gets the SHA-256 of the nonce; Nhost gets the raw value and checks it against the token. */
export async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
      nonce: hashedNonce,
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') throw new Error('Apple sign-in was cancelled');
    throw error;
  }
  if (!credential.identityToken) throw new Error('No identity token returned from Apple sign-in');

  await nhost.auth.signInIdToken({
    provider: 'apple',
    idToken: credential.identityToken,
    nonce: rawNonce,
    options: { allowedRoles: ['user', 'me'] },
  });
  await nhost.refreshSession(0);
}

export async function isAppleSignInAvailable() {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

/** Where Nhost sends a tapped verify or reset link. Must be on auth.redirections.allowedUrls. */
function appUrl(path: 'auth/verified' | 'auth/reset') {
  return Linking.createURL(`/${path}`);
}

/** Nhost's error code (unverified-user, invalid-email-password, user-already-exists, …) from a failed call. */
export function authErrorCode(error: unknown): string | null {
  const body = (error as { body?: { error?: unknown } } | null)?.body;
  return typeof body?.error === 'string' ? body.error : null;
}

/** Turns the refresh token from a verify or reset redirect into a session. */
export async function exchangeRefreshToken(refreshToken: string) {
  await nhost.auth.refreshToken({ refreshToken });
  await nhost.refreshSession(0);
}

export async function signIn(email: string, password: string) {
  const result = await nhost.auth.signInEmailPassword({ email, password });
  await nhost.refreshSession(0);
  return result.body;
}

/** With email verification required there is no session until the link is tapped; `verify` says so. */
export async function signUp(email: string, password: string) {
  const result = await nhost.auth.signUpEmailPassword({
    email,
    password,
    options: { allowedRoles: ['user', 'me'], redirectTo: appUrl('auth/verified') },
  });
  if (result.body.session) {
    await nhost.refreshSession(0);
    return { verify: false };
  }
  return { verify: true };
}

export async function sendVerificationEmail(email: string) {
  return nhost.auth.sendVerificationEmail({ email, options: { redirectTo: appUrl('auth/verified') } });
}

export async function sendPasswordResetEmail(email: string) {
  return nhost.auth.sendPasswordResetEmail({ email, options: { redirectTo: appUrl('auth/reset') } });
}

/** The reset link signs the user in, so the new password is set on the current session. */
export async function changePassword(newPassword: string) {
  return nhost.auth.changeUserPassword({ newPassword });
}
