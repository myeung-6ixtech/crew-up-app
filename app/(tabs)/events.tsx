import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { PlusGlyph, TabTitle } from '@/components/crew/kit';
import { EventCard, NoMeetsCard, eventTagNames, isPlatformEvent, type EventAccess } from '@/components/events/EventCard';
import { LockGlyph } from '@/components/events/pin';
import { isPrivateEvent } from '@/constants/events';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { SearchGlyph } from '@/features/onboarding/components/kit';
import { useCreateEventFlow } from '@/hooks/useCreateEventFlow';
import { useAuth } from '@/hooks/useSession';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticSelection } from '@/lib/haptics';
import { fetchEvents, fetchMyEventUnlocks } from '@/services/eventService';
import { fontFamily, useTheme } from '@/theme';
import type { EventItem } from '@/types/domain';

type EventFilter = 'public' | 'private';

/** Search matches the title, the city, an activity name or an interest name. */
function matchesQuery(event: EventItem, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const { activities, interests } = eventTagNames(event);
  return [event.title, event.city, ...activities, ...interests].some((value) => value?.toLowerCase().includes(needle));
}

/**
 * Events — design/…/CrewUp Events Prototype.dc.html, 6A. Search, one Public / Private filter, then cards. The + always
 * opens "What kind of meet?" first. Private meets stay locked until the PIN is entered (or you host them).
 */
export default function EventsTab() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  const client = useApolloClient();
  const { openCreateEvent, meetTypeOverlay } = useCreateEventFlow();
  const { userId } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<EventFilter>('public');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // From a layover's "See all": events in that city during that window, shown as a clearable chip.
  const params = useLocalSearchParams<{ city?: string; from?: string; to?: string }>();
  const [window, setWindow] = useState<{ city: string; from: string; to: string } | null>(null);
  useEffect(() => {
    if (params.city && params.from && params.to) {
      setWindow({ city: params.city, from: params.from, to: params.to });
      setFilter('public');
      setQuery('');
    }
  }, [params.city, params.from, params.to]);
  const tabScroll = useTabBarScroll({ contentContainerStyle: { paddingHorizontal: 24 } });

  const load = useCallback(async () => {
    const [list, mine] = await Promise.all([fetchEvents(client), fetchMyEventUnlocks(client).catch(() => new Set<string>())]);
    setEvents(list);
    setUnlocked(mine);
  }, [client]);

  const accessFor = (event: EventItem): EventAccess => {
    if (userId && event.creator_id === userId && !isPlatformEvent(event)) return 'hosting';
    if (!isPrivateEvent(event)) return 'open';
    return unlocked.has(event.id) ? 'unlocked' : 'locked';
  };

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(
    () =>
      events
        .filter((event) => !event.cancelled_at)
        .filter((event) => (filter === 'private' ? isPrivateEvent(event) : !isPrivateEvent(event)))
        .filter((event) => matchesQuery(event, query))
        .filter((event) => {
          if (!window) return true;
          if ((event.city ?? '').toLowerCase() !== window.city.toLowerCase()) return false;
          // Overlaps the window; an event with no end counts as 2 hours.
          const start = Date.parse(event.starts_at);
          const end = event.ends_at ? Date.parse(event.ends_at) : start + 2 * 60 * 60 * 1000;
          return start < Date.parse(window.to) && end > Date.parse(window.from);
        }),
    [events, filter, query, window],
  );

  return (
    <Screen style={{ padding: 0 }}>
      {meetTypeOverlay}
      <View style={{ paddingTop: insets.top }}>
        <TabTitle
          title={t('tabs.events')}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('events.create')}
              onPress={openCreateEvent}
              style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, backgroundColor: '#0E1113', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
              <PlusGlyph color="#A8E05F" />
            </Pressable>
          }
        />
        <View
          style={{
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.field,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 18,
            marginTop: 14,
            marginHorizontal: 24,
          }}>
          <SearchGlyph />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('events.searchPlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            accessibilityLabel={t('events.searchPlaceholder')}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 15, color: theme.colors.textPrimary, padding: 0 }}
          />
        </View>
        {window ? (
          <View style={{ flexDirection: 'row', marginTop: 10, marginHorizontal: 24 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('events.windowClearA11y', { city: window.city })}
              onPress={() => {
                hapticSelection();
                setWindow(null);
                router.setParams({ city: undefined, from: undefined, to: undefined });
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 16,
                backgroundColor: theme.colors.accentSubtle,
                opacity: pressed ? 0.8 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.accentText }}>
                {`${window.city} · ${new Date(window.from).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${new Date(window.to).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
              </Text>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.accentText }}>✕</Text>
            </Pressable>
          </View>
        ) : null}
        <View
          accessibilityRole="tablist"
          style={{ flexDirection: 'row', gap: 4, marginTop: 12, marginHorizontal: 24, backgroundColor: theme.colors.field, borderRadius: 20, padding: 4 }}>
          {(['public', 'private'] as EventFilter[]).map((value) => {
            const selected = filter === value;
            const fg = selected ? theme.colors.ground : theme.colors.textPrimary;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  hapticSelection();
                  setFilter(value);
                }}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: selected ? theme.colors.ink : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                {value === 'private' ? <LockGlyph color={fg} size={10} /> : null}
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: fg }}>{t(`events.filter.${value}`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <ScrollView
        {...tabScroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await load();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }>
        {visible.length ? (
          <View style={{ gap: 10, marginTop: 14 }}>
            {visible.map((event) => (
              <EventCard key={event.id} event={event} access={accessFor(event)} onPress={() => router.push(SCREENS.events.detail(event.id))} />
            ))}
          </View>
        ) : (
          <NoMeetsCard onCreate={openCreateEvent} />
        )}
      </ScrollView>
    </Screen>
  );
}
