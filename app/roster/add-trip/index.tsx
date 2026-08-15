import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui';
import { AddTripWizard } from '@/components/roster/AddTripWizard';
import { useAuth } from '@/hooks/useSession';

export default function AddTripScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <Screen style={{ padding: 0 }}>
      <AddTripWizard
        defaultOriginIata={profile?.base_airport}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
