import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LimePills } from '@/components/crew/kit';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { formatDateTime } from '@/lib/utils';
import { fontFamily, useTheme } from '@/theme';
import type { EventItem } from '@/types/domain';

export function isPlatformEvent(event: Pick<EventItem, 'host_type'>) {
  return event.host_type === 'platform';
}

/** Activities and interests on a meet, split by kind. */
export function eventTagNames(event: Pick<EventItem, 'eventActivities'>) {
  const rows = event.eventActivities ?? [];
  return {
    activities: rows.filter((row) => (row.activity.kind ?? 'activity') === 'activity').map((row) => row.activity.name),
    interests: rows.filter((row) => row.activity.kind === 'interest').map((row) => row.activity.name),
  };
}

/** Ink chip with lime mono text. */
export function CrewUpEventBadge({ tone = 'ink' }: { tone?: 'ink' | 'lime' }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <MonoLabel
      style={{
        fontSize: 10,
        color: tone === 'ink' ? theme.colors.fill : theme.colors.onFill,
        backgroundColor: tone === 'ink' ? '#0E1113' : theme.colors.fill,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
        alignSelf: 'flex-start',
      }}>
      {t('events.platformBadge')}
    </MonoLabel>
  );
}

/** Discovery card: badge when hosted by CrewUp, title, city · time, then activity and interest pills. */
export function EventCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  const theme = useTheme();
  const { activities, interests } = eventTagNames(event);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={event.title}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        padding: 16,
        gap: 8,
        opacity: pressed ? 0.85 : 1,
      })}>
      {isPlatformEvent(event) ? <CrewUpEventBadge /> : null}
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16.5, letterSpacing: -0.2, color: theme.colors.textPrimary }}>{event.title}</Text>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary }}>
        {`${event.city} · ${formatDateTime(event.starts_at)}`}
      </Text>
      <LimePills names={activities} />
      <LimePills names={interests} />
    </Pressable>
  );
}

/** Dashed empty state shared by an empty list and a search with no matches. */
export function NoMeetsCard({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View
      style={{
        marginTop: 28,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#C9CEC1',
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 22,
        alignItems: 'center',
        gap: 12,
      }}>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>{t('home.emptyEvents')}</Text>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 260 }}>
        {t('home.emptyEventsBody')}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onCreate}
        style={({ pressed }) => ({
          marginTop: 4,
          height: 44,
          borderRadius: 22,
          paddingHorizontal: 18,
          backgroundColor: theme.colors.fill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.onFill }}>{t('events.createEvent')}</Text>
      </Pressable>
    </View>
  );
}
