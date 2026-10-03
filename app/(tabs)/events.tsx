import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleButton, PlusGlyph, TabTitle } from '@/components/crew/kit';
import { EventCard, NoMeetsCard, eventTagNames, isPlatformEvent } from '@/components/events/EventCard';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { SearchGlyph } from '@/features/onboarding/components/kit';
import { useCreateEventFlow } from '@/hooks/useCreateEventFlow';
import { useTabBarScroll } from '@/hooks/useTabBarScroll';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticSelection } from '@/lib/haptics';
import { fetchEvents } from '@/services/eventService';
import { fontFamily, useTheme } from '@/theme';
import type { EventItem } from '@/types/domain';

type EventFilter = 'all' | 'platform' | 'community';

/** Search matches the title, the city, an activity name or an interest name. */
function matchesQuery(event: EventItem, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const { activities, interests } = eventTagNames(event);
  return [event.title, event.city, ...activities, ...interests].some((value) => value?.toLowerCase().includes(needle));
}

/** The front door for meets: search, three filters, then cards. The header + skips the public-or-private sheet. */
export default function EventsTab() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { openCreateEvent, meetTypeOverlay } = useCreateEventFlow();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState<EventFilter>('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const tabScroll = useTabBarScroll({ contentContainerStyle: { paddingHorizontal: 24 } });

  const load = useCallback(async () => {
    setEvents(await fetchEvents(client));
  }, [client]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(
    () =>
      events
        .filter((event) => !event.cancelled_at)
        .filter((event) => (filter === 'platform' ? isPlatformEvent(event) : filter === 'community' ? !isPlatformEvent(event) : true))
        .filter((event) => matchesQuery(event, query)),
    [events, filter, query],
  );

  return (
    <Screen style={{ padding: 0 }}>
      {meetTypeOverlay}
      <View style={{ paddingTop: insets.top }}>
        <TabTitle
          title={t('tabs.events')}
          right={
            <CircleButton accessibilityLabel={t('events.create')} onPress={() => router.push(SCREENS.events.create)}>
              <PlusGlyph color={theme.colors.textPrimary} />
            </CircleButton>
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
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8, paddingTop: 12, paddingHorizontal: 24 }}>
          {(['all', 'platform', 'community'] as EventFilter[]).map((value) => {
            const selected = filter === value;
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
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: selected ? theme.colors.ink : theme.colors.field,
                  justifyContent: 'center',
                }}>
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: selected ? theme.colors.ground : theme.colors.textPrimary }}>
                  {t(`events.filter.${value}`)}
                </Text>
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
              <EventCard key={event.id} event={event} onPress={() => router.push(SCREENS.events.detail(event.id))} />
            ))}
          </View>
        ) : (
          <NoMeetsCard onCreate={openCreateEvent} />
        )}
      </ScrollView>
    </Screen>
  );
}
