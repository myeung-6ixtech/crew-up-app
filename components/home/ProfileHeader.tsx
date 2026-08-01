import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  HeadlineText,
  BodyText,
  LabelText,
  NumericText,
  StatusDot,
  type CrewStatus,
} from '@/components/ui';
import { useThemedStyles } from '@/theme';
import { SCREENS } from '@/constants/screens';
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
  const styles = useThemedStyles((t) => ({
    section: {
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.xl,
      paddingBottom: t.spacing.md,
      backgroundColor: t.colors.bgCanvas,
    },
    row1: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    avatarWrap: { position: 'relative' },
    statusOverlay: {
      position: 'absolute',
      right: 0,
      bottom: 0,
    },
    identity: { flex: 1 },
    row2: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: t.spacing.md,
      gap: t.spacing.sm,
    },
    stat: { flex: 1, alignItems: 'center' },
    row3: { marginTop: t.spacing.md },
  }));

  const stats = [
    { value: tripCount, label: t('home.statsTrips') },
    { value: cityCount, label: t('home.statsCities') },
    { value: connectionCount, label: t('home.statsConnections') },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.row1}>
        <View style={styles.avatarWrap}>
          <Avatar name={profile?.display_name} size="lg" />
          <View style={styles.statusOverlay}>
            <StatusDot status={status} size={10} compact pulseKey={statusPulseKey} />
          </View>
        </View>
        <View style={styles.identity}>
          <HeadlineText>{profile?.display_name ?? t('home.yourProfile')}</HeadlineText>
          <BodyText muted>{formatProfileCaption(profile, airlineName)}</BodyText>
        </View>
      </View>

      <View style={styles.row2}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <NumericText>{s.value}</NumericText>
            <LabelText>{s.label}</LabelText>
          </View>
        ))}
      </View>

      <View style={styles.row3}>
        <Button
          label={t('home.editProfile')}
          variant="secondary"
          noTopMargin
          onPress={() => router.push(SCREENS.profile.edit)}
        />
      </View>
    </View>
  );
}
