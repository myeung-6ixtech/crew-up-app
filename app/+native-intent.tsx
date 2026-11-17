/**
 * Incoming links (expo-router native intent). Google sign-in returns to crewup://auth/callback with the refresh
 * token; signInWithGoogle (services/authService.ts) reads it from the auth session. That return is not a screen, so
 * the router must not navigate: on Android it would replace the screen waiting for Google, and the result (or an
 * error) would land on a screen that's gone. Every other link routes as usual.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (/(^|[/:])auth\/callback(\?|$|\/)/.test(path)) return null;
  } catch {
    // Never block a link on a parsing problem.
  }
  return path;
}
