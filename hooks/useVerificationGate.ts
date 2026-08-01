import { useAuth } from '@/hooks/useSession';

export { useAuth } from '@/hooks/useSession';

/** Crew ID verification gate is disabled for now — see useAuthGuard. */
export function useVerificationGate() {
  const { hasProfile, loading } = useAuth();
  return {
    loading,
    canAccessApp: hasProfile,
    needsVerification: false,
  };
}
