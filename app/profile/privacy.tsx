import { useEffect, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApolloClient } from '@/lib/apolloHooks';
import {
  Screen,
  Button,
  Subtitle,
  BodyText,
  SelectionOption,
  SectionLabel,
  PillSelectorGroup,
} from '@/components/ui';
import { type VisibilityLevel } from '@/constants/screens';
import { formatOptionLabel } from '@/lib/formatOptionLabel';
import {
  normalizeVisibilityForAffiliation,
  visibilityLevelsForAffiliation,
} from '@/lib/visibilityOptions';
import { formatApolloError } from '@/lib/graphqlError';
import { useAuth, useSession } from '@/hooks/useSession';
import { updateProfile } from '@/services/profileService';
import { useThemedStyles, useTheme } from '@/theme';

export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, userId } = useAuth();
  const { refreshProfile, refreshSession } = useSession();
  const styles = useThemedStyles((t) => ({
    scroll: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl + 80 },
    section: { marginBottom: t.spacing.xl },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      paddingBottom: Math.max(insets.bottom, t.spacing.lg),
      backgroundColor: t.colors.bgCanvas,
      borderTopWidth: 1,
      borderTopColor: t.colors.hairline,
      gap: t.spacing.xs,
    },
  }));

  const airlineId = profile?.airline_id ?? undefined;
  const [visibility, setVisibility] = useState<VisibilityLevel>(profile?.default_visibility ?? 'friends');
  const [statusDefaultHidden, setStatusDefaultHidden] = useState(profile?.default_visibility === 'off');
  const [notificationMode, setNotificationMode] = useState(profile?.notification_mode ?? 'realtime');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profile) return;
    setVisibility(profile.default_visibility ?? 'friends');
    setStatusDefaultHidden(profile.default_visibility === 'off');
    setNotificationMode(profile.notification_mode ?? 'realtime');
  }, [profile]);

  useEffect(() => {
    if (!airlineId && visibility === 'same_airline') {
      setVisibility('friends');
    }
  }, [airlineId, visibility]);

  const onSave = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const resolvedVisibility: VisibilityLevel = statusDefaultHidden
        ? 'off'
        : normalizeVisibilityForAffiliation(visibility, airlineId);
      await updateProfile(client, userId, {
        default_visibility: resolvedVisibility,
        notification_mode: notificationMode,
      });
      await refreshSession();
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(formatApolloError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <SectionLabel>{t('home.statusDefault')}</SectionLabel>
            <SelectionOption
              label={t('home.statusAvailableDefault')}
              selected={!statusDefaultHidden}
              onPress={() => setStatusDefaultHidden(false)}
            />
            <SelectionOption
              label={t('home.statusHiddenDefault')}
              selected={statusDefaultHidden}
              onPress={() => setStatusDefaultHidden(true)}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('home.editPrivacy')}</SectionLabel>
            <Subtitle>{t('home.presencePrivacyHint')}</Subtitle>
            <PillSelectorGroup
              label={t('onboarding.visibility')}
              options={visibilityLevelsForAffiliation(airlineId).map((v) => ({
                value: v,
                label: formatOptionLabel(v),
              }))}
              value={statusDefaultHidden ? undefined : visibility}
              onChange={(v) => {
                setStatusDefaultHidden(false);
                setVisibility(v);
              }}
            />
            <Subtitle>{t('home.notifications')}</Subtitle>
            {(['realtime', 'digest'] as const).map((mode) => (
              <SelectionOption
                key={mode}
                label={mode}
                selected={notificationMode === mode}
                onPress={() => setNotificationMode(mode)}
              />
            ))}
          </View>

          {error ? <BodyText style={{ color: theme.colors.statusOnDuty }}>{error}</BodyText> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t('home.saveChanges')} onPress={onSave} loading={loading} noTopMargin />
          <Button label={t('common.cancel')} onPress={() => router.back()} variant="ghost" noTopMargin />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
