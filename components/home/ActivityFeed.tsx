import { Pressable, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, BodyText, NumericText, SectionLabel, EmptyState } from '@/components/ui';
import { HOME_SECTION_PADDING, HOME_SECTION_SPACING } from '@/constants/homeLayout';
import { useThemedStyles } from '@/theme';

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
    section: {
      paddingHorizontal: HOME_SECTION_PADDING,
      marginBottom: HOME_SECTION_SPACING,
    },
    cardGap: { marginBottom: t.spacing.md },
  }));

  return (
    <View style={styles.section}>
      <SectionLabel>{t('home.activity')}</SectionLabel>
      {items.length ? (
        items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.cardGap}
            onPress={() => item.route && router.push(item.route as Href)}>
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
