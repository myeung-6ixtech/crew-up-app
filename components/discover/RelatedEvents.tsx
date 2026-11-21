import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIcon } from '@/components/icons/ActivityIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { SCREENS } from '@/constants/screens';
import { useStorageFileUri } from '@/hooks/useStorageFileUri';
import { formatAirportDate } from '@/lib/airportTime';
import type { RelatedEvent } from '@/services/eventService';
import { fontFamily } from '@/theme';

const INK = '#0E1113';
const CARD = '#FFFFFF';
const SOFT = '#F2F4EE';
const GREY = '#EAECE5';
const TEXT_2 = '#545A50';
const TEXT_3 = '#6F7569';
const GREEN = '#4F6E19';
const MEDIA_HEIGHT = 112;
/** Thumbnail width asked of storage (~2× the card on a phone). */
const THUMB_WIDTH = 480;

/** Short names for long activity types on a small card. */
const SHORT_TYPE: Record<string, string> = {
  music_event: 'Concert',
  music_festival: 'Concert',
  concert: 'Concert',
  sporting_events: 'Sporting event',
};

export function relatedEventType(event: Pick<RelatedEvent, 'typeSlug' | 'typeName'>): string {
  return (event.typeSlug && SHORT_TYPE[event.typeSlug]) || event.typeName || '';
}

/** "Thu 8 Oct, 18:00", in the layover city's time. */
export function relatedEventWhen(iso: string, airportCode: string | null): string {
  const day = formatAirportDate(iso, airportCode, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
  const time = formatAirportDate(iso, airportCode, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day}, ${time}`;
}

/** The type's crew icon on a soft panel: what a card shows with no cover (or one that fails to load). */
function NoImageMedia({ event }: { event: RelatedEvent }) {
  return (
    <View style={{ height: MEDIA_HEIGHT, backgroundColor: SOFT, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIcon slug={event.typeSlug} name={event.typeName ?? event.title} size={44} color={INK} />
    </View>
  );
}

function Media({ event }: { event: RelatedEvent }) {
  const file = useStorageFileUri(event.coverImageUrl ? null : event.coverFileId, { width: THUMB_WIDTH });
  const [failed, setFailed] = useState(false);
  const uri = event.coverImageUrl ?? file.uri;
  const hasCover = Boolean(event.coverImageUrl || event.coverFileId);
  if (!hasCover || failed) return <NoImageMedia event={event} />;
  return (
    <View style={{ height: MEDIA_HEIGHT, backgroundColor: GREY }}>
      {uri ? (
        <Image
          // Decorative: the card's label already says what the event is.
          accessible={false}
          accessibilityIgnoresInvertColors
          source={{ uri, headers: event.coverImageUrl ? undefined : file.headers }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: MEDIA_HEIGHT }}
        />
      ) : null}
    </View>
  );
}

function EventTile({ event, airportCode, onPress }: { event: RelatedEvent; airportCode: string | null; onPress: () => void }) {
  const type = relatedEventType(event);
  const when = relatedEventWhen(event.startsAt, airportCode);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={[event.title, type, when, event.venueName].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, backgroundColor: CARD, borderRadius: 20, overflow: 'hidden', opacity: pressed ? 0.88 : 1 })}>
      <Media event={event} />
      <View style={{ paddingTop: 12, paddingHorizontal: 12, paddingBottom: 14, gap: 5 }}>
        {type ? (
          <Text numberOfLines={1} style={{ fontFamily: fontFamily.monoMedium, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: GREEN }}>
            {type}
          </Text>
        ) : null}
        <Text numberOfLines={2} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14.5, lineHeight: 18, color: INK }}>
          {event.title}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: TEXT_2 }}>
          {when}
        </Text>
        {event.venueName ? (
          <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: TEXT_3 }}>
            {event.venueName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function SkeletonTile() {
  return (
    <View style={{ flex: 1, backgroundColor: CARD, borderRadius: 20, overflow: 'hidden' }}>
      <Skeleton height={MEDIA_HEIGHT} borderRadius={0} />
      <View style={{ paddingTop: 12, paddingHorizontal: 12, paddingBottom: 14, gap: 8 }}>
        <Skeleton width="40%" height={9} borderRadius={5} />
        <Skeleton width="85%" height={13} borderRadius={7} />
        <Skeleton width="60%" height={11} borderRadius={6} />
      </View>
    </View>
  );
}

/**
 * "Related events · In {City}" at the bottom of a saved layover: up to 4 meets in the city during the rest window,
 * two per row. The whole card opens the event. Hidden when there are none or the request failed (`events` null).
 */
export function RelatedEvents({
  city,
  airportCode,
  events,
  loading,
  onSeeAll,
}: {
  city: string;
  airportCode: string | null;
  /** null: failed or not loaded. */
  events: RelatedEvent[] | null;
  loading: boolean;
  onSeeAll: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  if (!loading && (!events || !events.length)) return null;
  const rows: (RelatedEvent | null)[][] = [];
  const list = loading ? [null, null] : (events ?? []);
  for (let index = 0; index < list.length; index += 2) rows.push([list[index] ?? null, list[index + 1] ?? null]);

  return (
    <View style={{ marginTop: 28 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 1.05, textTransform: 'uppercase', color: TEXT_2 }}>
            {t('layover.relatedEvents')}
          </Text>
          <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 18, letterSpacing: -0.18, color: INK }}>
            {t('layover.inCity', { city })}
          </Text>
        </View>
        {loading ? null : (
          <Pressable accessibilityRole="link" accessibilityLabel={t('layover.seeAllEventsA11y', { city })} hitSlop={8} onPress={onSeeAll}>
            <Text style={{ fontFamily: fontFamily.interSemiBold, fontSize: 13, color: GREEN }}>{t('layover.seeAll')}</Text>
          </Pressable>
        )}
      </View>
      <View style={{ marginTop: 12, gap: 10 }}>
        {rows.map((row, rowIndex) => (
          // A row stretches its cards to the taller one, so image and no-image cards line up. An odd last card
          // keeps one column (the empty cell is a spacer).
          <View key={rowIndex} style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>
            {row.map((event, cellIndex) =>
              loading ? (
                <SkeletonTile key={cellIndex} />
              ) : event ? (
                <EventTile key={event.id} event={event} airportCode={airportCode} onPress={() => router.push(SCREENS.events.detail(event.id))} />
              ) : (
                <View key={cellIndex} style={{ flex: 1 }} />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
