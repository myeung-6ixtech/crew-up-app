import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ApolloClient } from '@apollo/client';
import { AppIcon, ListRow, SectionLabel, EmptyState } from '@/components/ui';
import { HOME_SECTION_PADDING, HOME_SECTION_SPACING } from '@/constants/homeLayout';
import { useThemedStyles, useTheme } from '@/theme';
import { SCREENS } from '@/constants/screens';
import { requestConnection } from '@/services/connectionService';
import type { TripMatchEntry } from '@/types/trip';
import { matchReasonLabel } from '@/types/trip';

export function CrewCrossingPaths({
  matches,
  client,
  onWave,
  embedded = false,
}: {
  matches: TripMatchEntry[];
  client: ApolloClient;
  onWave?: () => void;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles((themeTokens) => ({
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
      {!embedded ? <SectionLabel>{t('home.crewMatches')}</SectionLabel> : null}
      {matches.length ? (
        <View style={{ width: '100%' }}>
          {matches.slice(0, 12).map((match) => (
            <ListRow
              key={match.id}
              inset={false}
              avatarName={match.matchedUser?.profile?.display_name ?? undefined}
              title={match.matchedUser?.profile?.display_name ?? t('home.crewMember')}
              subtitle={matchReasonLabel(match, t)}
              onPress={() => router.push(SCREENS.network.user(match.matched_user_id))}
              right={
                <Pressable
                  style={styles.wave}
                  accessibilityLabel={t('home.wave')}
                  onPress={() => void onWavePress(match.matched_user_id)}>
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
