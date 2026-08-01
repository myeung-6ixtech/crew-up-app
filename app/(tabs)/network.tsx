import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Subtitle, Button, Card, BodyText } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles } from '@/theme';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';

export default function NetworkTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.lg },
  }));
  const tabScroll = useTabBarScroll({ contentContainerStyle: styles.content });

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView {...tabScroll}>
        <Title>{t('tabs.network')}</Title>
        <Subtitle>{t('network.discoverSubtitle')}</Subtitle>

        <Card>
          <BodyText strong>{t('network.discover')}</BodyText>
          <BodyText muted style={{ marginBottom: 12 }}>
            Find verified crew at your base, on layover, or heading to the same city.
          </BodyText>
          <Button label={t('network.discover')} onPress={() => router.push(SCREENS.network.discover)} />
        </Card>

        <Card>
          <BodyText strong>{t('network.connections')}</BodyText>
          <BodyText muted style={{ marginBottom: 12 }}>{t('friends.subtitle')}</BodyText>
          <Button
            label={t('tabs.friends')}
            onPress={() => router.push(SCREENS.tabs.friends)}
            variant="secondary"
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}
