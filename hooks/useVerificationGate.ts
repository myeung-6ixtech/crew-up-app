import { useAuth } from '@/hooks/useSession';

export { useAuth } from '@/hooks/useSession';

/** Redirect unverified users away from protected tabs — see useAuthGuard. */
export function useVerificationGate() {
  const { isVerified, hasProfile, loading } = useAuth();
  return {
    loading,
    canAccessApp: hasProfile && isVerified,
    needsVerification: hasProfile && !isVerified,
  };
}
