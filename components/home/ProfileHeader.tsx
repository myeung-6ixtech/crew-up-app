import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  HeadlineText,
  BodyText,
  LabelText,
  NumericText,
  StatusDot,
  Button,
  AppIcon,
  type CrewStatus,
} from '@/components/ui';
import { HOME_SECTION_PADDING } from '@/constants/homeLayout';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles, useTheme } from '@/theme';
import { formatProfileCaption } from '@/lib/dutyStatus';
import type { Profile } from '@/types/domain';

export function ProfileHeader({
  profile,
  status,
  statusPulseKey,
  tripCount,
  cityCount,
  connectionCount,
  airlineName,
}: {
  profile: Profile | null;
  status: CrewStatus;
  statusPulseKey?: string | number;
  tripCount: number;
  cityCount: number;
  connectionCount: number;
  airlineName?: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    section: {
      paddingHorizontal: HOME_SECTION_PADDING,
      paddingTop: t.spacing.lg,
      paddingBottom: t.spacing.lg,
      backgroundColor: t.colors.bgCanvas,
      alignItems: 'center',
    },
    avatarWrap: { position: 'relative', marginBottom: t.spacing.md },
    statusOverlay: {
      position: 'absolute',
      right: 4,
      bottom: 4,
    },
    identity: { alignItems: 'center', gap: t.spacing.xs, marginBottom: t.spacing.lg },
    name: { textAlign: 'center' },
    caption: { textAlign: 'center' },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      gap: t.spacing.xl,
      marginBottom: t.spacing.xl,
    },
    stat: { alignItems: 'center', minWidth: 72 },
    ctaWrap: { width: '100%' },
  }));

  const stats = [
    { value: tripCount, label: t('home.statsTrips') },
    { value: cityCount, label: t('home.statsCities') },
    { value: connectionCount, label: t('home.statsConnections') },
  ];

  const openAddTrip = () => router.push(SCREENS.roster.addTrip);

  return (
    <View style={styles.section}>
      <View style={styles.avatarWrap}>
        <Avatar name={profile?.display_name} size="xl" />
        <View style={styles.statusOverlay}>
          <StatusDot status={status} size={12} compact pulseKey={statusPulseKey} />
        </View>
      </View>

      <View style={styles.identity}>
        <HeadlineText style={styles.name}>
          {profile?.display_name ?? t('home.yourProfile')}
        </HeadlineText>
        <BodyText muted style={styles.caption}>
          {formatProfileCaption(profile, airlineName)}
        </BodyText>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <NumericText>{s.value}</NumericText>
            <LabelText>{s.label}</LabelText>
          </View>
        ))}
      </View>

      <View style={styles.ctaWrap}>
        <Button
          label={t('home.addTrip')}
          onPress={openAddTrip}
          noTopMargin
          icon={<AppIcon name="add" size={20} color={theme.colors.textInverse} />}
        />
        {tripCount === 0 ? (
          <BodyText muted style={{ textAlign: 'center', marginTop: theme.spacing.sm }}>
            {t('home.addTripEmptyHint')}
          </BodyText>
        ) : null}
      </View>
    </View>
  );
}
