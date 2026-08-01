import { useRouter } from 'expo-router';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen } from '@/components/ui';
import { AddTripForm } from '@/components/home/AddTripForm';
import { useAuth, useSession } from '@/hooks/useSession';

export default function AddTripScreen() {
  const router = useRouter();
  const client = useApolloClient();
  const { userId, profile } = useAuth();
  const { refreshProfile } = useSession();

  if (!userId) return null;

  return (
    <Screen style={{ padding: 0 }}>
      <AddTripForm
        client={client}
        userId={userId}
        profile={profile}
        refreshProfile={refreshProfile}
        onSaved={() => router.back()}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
