import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ApolloClient } from '@apollo/client';
import { AppIcon, ListRow, SectionLabel, EmptyState } from '@/components/ui';
import { HOME_SECTION_PADDING, HOME_SECTION_SPACING } from '@/constants/homeLayout';
import { useThemedStyles, useTheme } from '@/theme';
import { SCREENS } from '@/constants/screens';
import { formatDateRange } from '@/lib/utils';
import { requestConnection } from '@/services/connectionService';

type CrossingPath = {
  id: string;
  user_id: string;
  city: string;
  date_start: string;
  date_end: string;
  user?: {
    profile?: {
      display_name?: string;
      role_type?: string;
    };
  };
};

export function CrewCrossingPaths({
  paths,
  client,
  onWave,
  embedded = false,
}: {
  paths: CrossingPath[];
  client: ApolloClient;
  onWave?: () => void;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    section: {
      paddingHorizontal: embedded ? 0 : HOME_SECTION_PADDING,
      marginBottom: embedded ? 0 : HOME_SECTION_SPACING,
      width: '100%',
      alignItems: 'center',
    },
    wave: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));

  const onWavePress = async (userId: string) => {
    await requestConnection(client, userId, t('home.waveMessage'));
    onWave?.();
  };

  return (
    <View style={styles.section}>
      {!embedded ? <SectionLabel>{t('home.crossingPaths')}</SectionLabel> : null}
      {paths.length ? (
        <View style={{ width: '100%' }}>
          {paths.slice(0, 12).map((p) => (
          <ListRow
            key={p.id}
            inset={false}
            avatarName={p.user?.profile?.display_name}
            title={p.user?.profile?.display_name ?? t('home.crewMember')}
            subtitle={`${p.city} · ${formatDateRange(p.date_start, p.date_end)}`}
            onPress={() => router.push(SCREENS.network.user(p.user_id))}
            right={
              <Pressable
                style={styles.wave}
                accessibilityLabel={t('home.wave')}
                onPress={() => void onWavePress(p.user_id)}>
                <AppIcon name="friends" size={22} color={theme.colors.accent} />
              </Pressable>
            }
          />
          ))}
        </View>
      ) : (
        <EmptyState title={t('home.emptyCrossing')} body={t('home.emptyCrossingBody')} />
      )}
    </View>
  );
}
