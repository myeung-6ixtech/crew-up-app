import { useState } from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Subtitle, Button } from '@/components/ui';
import { VISIBILITY_LEVELS, type VisibilityLevel } from '@/constants/screens';
import { useAuth, useSession } from '@/hooks/useSession';
import { updateProfile } from '@/services/profileService';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { profile, userId } = useAuth();
  const { refreshProfile } = useSession();
  const [visibility, setVisibility] = useState<VisibilityLevel>(profile?.default_visibility ?? 'friends');
  const [notificationMode, setNotificationMode] = useState(profile?.notification_mode ?? 'realtime');
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await updateProfile(client, userId, {
        default_visibility: visibility,
        notification_mode: notificationMode,
      });
      await refreshProfile();
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>Privacy</Title>
        <Subtitle>Who can see your layover presence on the next recompute.</Subtitle>
        {VISIBILITY_LEVELS.map((v) => (
          <Pressable key={v} onPress={() => setVisibility(v)} style={{ paddingVertical: 8 }}>
            <Text style={{ color: visibility === v ? '#0B5FFF' : '#0F172A' }}>{v}</Text>
          </Pressable>
        ))}
        <Subtitle>Notifications</Subtitle>
        {(['realtime', 'digest'] as const).map((mode) => (
          <Pressable key={mode} onPress={() => setNotificationMode(mode)} style={{ paddingVertical: 8 }}>
            <Text style={{ color: notificationMode === mode ? '#0B5FFF' : '#0F172A' }}>{mode}</Text>
          </Pressable>
        ))}
        <Button label={t('common.save')} onPress={onSave} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
