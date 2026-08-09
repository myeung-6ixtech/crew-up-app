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

export function ActivityFeed({
  items,
  embedded = false,
  onCreateEvent,
}: {
  items: ActivityItem[];
  embedded?: boolean;
  onCreateEvent?: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const styles = useThemedStyles((t) => ({
    section: {
      paddingHorizontal: embedded ? 0 : HOME_SECTION_PADDING,
      marginBottom: embedded ? 0 : HOME_SECTION_SPACING,
      width: '100%',
      alignItems: 'center',
    },
    cardGap: { marginBottom: t.spacing.md },
  }));

  return (
    <View style={styles.section}>
      {!embedded ? <SectionLabel>{t('home.activity')}</SectionLabel> : null}
      {items.length ? (
        <View style={{ width: '100%' }}>
          {items.map((item) => (
          <Pressable
            key={item.id}
            style={styles.cardGap}
            onPress={() => item.route && router.push(item.route as Href)}>
            <Card>
              <BodyText strong>{item.title}</BodyText>
              <NumericText muted>{item.subtitle}</NumericText>
            </Card>
          </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState
          title={t('home.emptyActivity')}
          actionLabel={onCreateEvent ? t('events.createEvent') : undefined}
          onAction={onCreateEvent}
        />
      )}
    </View>
  );
}
