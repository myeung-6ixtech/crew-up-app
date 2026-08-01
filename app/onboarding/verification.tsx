import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SCREENS } from '@/constants/screens';

/** Crew ID verification is disabled for now — send users to the main app. */
export default function VerificationScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace(SCREENS.tabs.home);
  }, [router]);

  return null;
}
