import { Image, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LockGlyph } from '@/components/events/pin';
import { isPrivateEvent } from '@/constants/events';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { useStorageFileUri } from '@/hooks/useStorageFileUri';
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

/** How the viewer stands with a meet: their own, a private one still behind its PIN, one they've unlocked, or public. */
export type EventAccess = 'hosting' | 'locked' | 'unlocked' | 'open';

type Badge = { label: string; bg: string; fg: string; lock?: boolean };

function badgesFor(event: EventItem, access: EventAccess, t: (key: string) => string): Badge[] {
  const badges: Badge[] = [];
  if (access === 'hosting') badges.push({ label: t('events.badge.hosting'), bg: '#0E1113', fg: '#A8E05F' });
  if (isPlatformEvent(event)) badges.push({ label: t('events.badge.event'), bg: '#A8E05F', fg: '#0E1113' });
  if (isPrivateEvent(event)) {
    if (access === 'locked') badges.push({ label: t('events.badge.private'), bg: '#0E1113', fg: '#F7F8F4', lock: true });
    else badges.push({ label: access === 'hosting' ? t('events.badge.private') : t('events.badge.privateUnlocked'), bg: '#EEF7DF', fg: '#2F4210', lock: access === 'hosting' });
  } else if (!isPlatformEvent(event)) {
    badges.push({ label: t('events.badge.public'), bg: '', fg: '' });
  }
  return badges;
}

/**
 * List card — design/…/CrewUp Events Prototype.dc.html, 6A. A 16:9 photo when the meet has one, otherwise a plain
 * listing; badges, title, city · time. A locked private meet shows nothing past that.
 */
export function EventCard({ event, access = 'open', onPress }: { event: EventItem; access?: EventAccess; onPress: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { uri, headers } = useStorageFileUri(event.featured_image_file_id);
  const badges = badgesFor(event, access, t);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[badges.map((badge) => badge.label).join(', '), event.title, event.city, formatDateTime(event.starts_at)].filter(Boolean).join('. ')}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.card,
        borderRadius: 20,
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
      })}>
      {uri ? (
        <Image
          source={headers ? { uri, headers } : { uri }}
          style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#0E1113' }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <View style={{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
          {badges.map((badge) => (
            <View
              key={badge.label}
              style={{
                height: 20,
                paddingHorizontal: 7,
                borderRadius: 6,
                backgroundColor: badge.bg || theme.colors.field,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}>
              {badge.lock ? <LockGlyph color={badge.fg || theme.colors.textPrimary} size={8} /> : null}
              <MonoLabel style={{ fontSize: 9.5, letterSpacing: 0.8, color: badge.fg || theme.colors.textPrimary }}>{badge.label}</MonoLabel>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16.5, letterSpacing: -0.2, color: theme.colors.textPrimary }}>{event.title}</Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary }}>
          {`${event.city} · ${formatDateTime(event.starts_at)}`}
        </Text>
        {access === 'locked' ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{t('events.lockedLine')}</Text>
        ) : null}
      </View>
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
