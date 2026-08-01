import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, BodyText, NumericText, SectionLabel, EmptyState } from '@/components/ui';
import { useThemedStyles } from '@/theme';
import { SCREENS } from '@/constants/screens';
import { Pressable } from 'react-native';

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  route?: string;
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    section: { marginBottom: t.spacing.xxxl },
  }));

  return (
    <View style={styles.section}>
      <SectionLabel>{t('home.activity')}</SectionLabel>
      {items.length ? (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => item.route && router.push(item.route as any)}>
            <Card>
              <BodyText strong>{item.title}</BodyText>
              <NumericText muted>{item.subtitle}</NumericText>
            </Card>
          </Pressable>
        ))
      ) : (
        <EmptyState title={t('home.emptyActivity')} />
      )}
    </View>
  );
}
