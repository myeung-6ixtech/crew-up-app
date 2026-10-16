import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RadioRow, SettingsHint, SettingsPage, SettingsSection } from '@/components/settings/settingsKit';
import { type VisibilityLevel } from '@/constants/screens';
import { PillCta } from '@/features/onboarding/components/kit';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatApolloError } from '@/lib/graphqlError';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { normalizeVisibilityForAffiliation, visibilityLevelsForAffiliation } from '@/lib/visibilityOptions';
import { useAuth, useSession } from '@/hooks/useSession';
import { updateProfile } from '@/services/profileService';
import { fontFamily, useTheme } from '@/theme';

type Audience = Exclude<VisibilityLevel, 'off'>;
type NotificationMode = 'realtime' | 'digest';

/**
 * 3E — status and audience depend on each other: Hidden clears the audience (saved as `off`), and picking an
 * audience switches status back to Available. Same airline only shows with an airline. Save stays grey until
 * something changes.
 */
export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const client = useApolloClient();
  const { profile, userId } = useAuth();
  const { refreshProfile, refreshSession } = useSession();
  const airlineId = profile?.airline_id ?? undefined;

  const saved = useMemo(() => {
    const visibility = profile?.default_visibility ?? 'friends';
    return {
      hidden: visibility === 'off',
      audience: (visibility === 'off' ? null : normalizeVisibilityForAffiliation(visibility, airlineId)) as Audience | null,
      notifications: (profile?.notification_mode ?? 'realtime') as NotificationMode,
    };
  }, [airlineId, profile?.default_visibility, profile?.notification_mode]);

  const [hidden, setHidden] = useState(saved.hidden);
  const [audience, setAudience] = useState<Audience | null>(saved.audience);
  const [notifications, setNotifications] = useState<NotificationMode>(saved.notifications);
  const [lastAudience, setLastAudience] = useState<Audience>(saved.audience ?? 'all_verified');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setHidden(saved.hidden);
    setAudience(saved.audience);
    setNotifications(saved.notifications);
    if (saved.audience) setLastAudience(saved.audience);
  }, [saved]);

  const dirty = hidden !== saved.hidden || (!hidden && audience !== saved.audience) || notifications !== saved.notifications;
  const audiences = visibilityLevelsForAffiliation(airlineId) as Audience[];

  const pickStatus = (nextHidden: boolean) => {
    setJustSaved(false);
    setHidden(nextHidden);
    setAudience(nextHidden ? null : (audience ?? lastAudience));
  };

  const pickAudience = (next: Audience) => {
    setJustSaved(false);
    setHidden(false);
    setAudience(next);
    setLastAudience(next);
  };

  const onSave = async () => {
    if (!userId || !dirty) return;
    setSaving(true);
    setError('');
    try {
      await updateProfile(client, userId, {
        default_visibility: hidden || !audience ? 'off' : normalizeVisibilityForAffiliation(audience, airlineId),
        notification_mode: notifications,
      });
      await refreshSession();
      await refreshProfile();
      hapticSuccess();
      setJustSaved(true);
    } catch (e) {
      hapticError();
      setError(formatApolloError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPage
      title={t('menu.privacy')}
      subtitle={t('privacy.intro')}
      footer={
        <PillCta
          label={justSaved && !dirty ? t('privacy.saved') : t('privacy.save')}
          disabled={!dirty && !justSaved}
          loading={saving}
          onPress={() => void onSave()}
        />
      }>
      <SettingsSection label={t('home.statusDefault')}>
        <RadioRow label={t('home.statusAvailableDefault')} selected={!hidden} onPress={() => pickStatus(false)} />
        <RadioRow label={t('home.statusHiddenDefault')} selected={hidden} onPress={() => pickStatus(true)} last />
      </SettingsSection>
      <SettingsHint>{t('privacy.statusHint')}</SettingsHint>

      <SettingsSection label={t('privacy.audienceLabel')}>
        {audiences.map((level, index) => (
          <RadioRow
            key={level}
            label={t(`privacy.audience.${level}`)}
            selected={!hidden && audience === level}
            dim={hidden}
            onPress={() => pickAudience(level)}
            last={index === audiences.length - 1}
          />
        ))}
      </SettingsSection>
      <SettingsHint>{hidden ? t('privacy.hiddenHint') : t('privacy.audienceHint')}</SettingsHint>

      <SettingsSection label={t('home.notifications')}>
        <RadioRow label={t('privacy.realtime')} selected={notifications === 'realtime'} onPress={() => setNotifications('realtime')} />
        <RadioRow label={t('privacy.digest')} selected={notifications === 'digest'} onPress={() => setNotifications('digest')} last />
      </SettingsSection>

      {error ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty }}>{error}</Text> : null}
    </SettingsPage>
  );
}
