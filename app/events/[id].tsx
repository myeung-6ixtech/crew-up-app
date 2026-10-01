import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CrewAvatar, PillGroup, PushedTopBar } from '@/components/crew/kit';
import { CrewUpEventBadge, eventTagNames } from '@/components/events/EventCard';
import { NAV_PILL_HEIGHT, StandaloneNavPill } from '@/components/navigation/FloatingTabBar';
import { ReportSheet } from '@/components/ReportSheet';
import { Screen } from '@/components/ui';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { fetchEvent, rsvpEvent } from '@/services/eventService';
import { reportUser } from '@/services/safetyService';
import { fontFamily, useTheme } from '@/theme';
import type { EventItem } from '@/types/domain';

type Attendee = {
  id: string;
  user_id: string;
  status: string;
  user?: { profile?: { display_name?: string | null; preferred_name?: string | null; avatar_file_id?: string | null } };
};

type EventDetail = EventItem & {
  description?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  attendees?: Attendee[];
};

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/** The meet: dark hero, notes, activity and interest pills, who's going, then RSVP. Going does not let them leave here. */
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setEvent(await fetchEvent(client, id));
  }, [client, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const myRsvp = event?.attendees?.find((attendee) => attendee.user_id === userId);
  const going = (event?.attendees ?? []).filter((attendee) => attendee.status === 'going');
  const platform = event?.host_type === 'platform';
  const { activities, interests } = event ? eventTagNames(event) : { activities: [], interests: [] };
  const venue = [event?.venue_name, event?.venue_address].filter(Boolean).join(' · ');

  const rsvp = async () => {
    if (!userId || !event) return;
    setJoining(true);
    try {
      await rsvpEvent(client, event.id, userId);
      hapticSuccess();
      await load();
    } catch {
      hapticError();
    } finally {
      setJoining(false);
    }
  };

  const rsvpLabel = !myRsvp ? t('events.rsvp') : myRsvp.status === 'going' ? `${t('events.going')} ✓` : t('events.waitlisted');

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar
          onBack={() => router.back()}
          right={
            event ? (
              <Text
                accessibilityRole="button"
                onPress={() => setReportOpen(true)}
                style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>
                {t('safety.report')}
              </Text>
            ) : null
          }
        />
      </View>
      {!event ? (
        <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 80 }} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <View style={{ backgroundColor: '#0E1113', borderRadius: 24, padding: 20, marginTop: 14, gap: 10 }}>
              {platform ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CrewUpEventBadge tone="lime" />
                  <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: '#A7B1B5' }}>{t('events.hostedByCrewUp')}</Text>
                </View>
              ) : null}
              <Text
                accessibilityRole="header"
                style={{ fontFamily: fontFamily.jakartaBold, fontSize: 27, lineHeight: 29, letterSpacing: -0.7, color: '#EDF1F2' }}>
                {event.title}
              </Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: '#A7B1B5' }}>
                {`${event.city} · ${formatWhen(event.starts_at)}`}
              </Text>
            </View>

            {event.description || venue ? (
              <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 16, marginTop: 12, gap: 6 }}>
                {venue ? (
                  <>
                    <MonoLabel style={{ fontSize: 10.5 }}>{t('events.venue')}</MonoLabel>
                    <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>{venue}</Text>
                  </>
                ) : null}
                {event.description ? (
                  <>
                    <MonoLabel style={{ fontSize: 10.5, marginTop: venue ? 8 : 0 }}>{t('events.notes')}</MonoLabel>
                    <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>
                      {event.description}
                    </Text>
                  </>
                ) : null}
              </View>
            ) : null}

            <View style={{ gap: 14, marginTop: 18 }}>
              <PillGroup label={t('onboarding.review.activitiesSection')} names={activities} />
              <PillGroup label={t('onboarding.review.interestsSection')} names={interests} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
              {going.length ? (
                <View style={{ flexDirection: 'row' }}>
                  {going.slice(0, 3).map((attendee, index) => (
                    <View
                      key={attendee.id}
                      style={{ marginRight: index < Math.min(going.length, 3) - 1 ? -10 : 0, borderWidth: 2, borderColor: theme.colors.ground, borderRadius: 17 }}>
                      <CrewAvatar
                        size={30}
                        name={attendee.user?.profile?.preferred_name || attendee.user?.profile?.display_name}
                        fileId={attendee.user?.profile?.avatar_file_id}
                        seed={attendee.user_id}
                      />
                    </View>
                  ))}
                </View>
              ) : null}
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary }}>
                {t('events.attendingCount', { count: going.length })}
              </Text>
            </View>
          </ScrollView>
          <View style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: insets.bottom + NAV_PILL_HEIGHT + 24 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(myRsvp), busy: joining }}
              disabled={Boolean(myRsvp) || joining}
              onPress={() => {
                hapticImpact();
                void rsvp();
              }}
              style={({ pressed }) => ({
                height: 56,
                borderRadius: 28,
                backgroundColor: myRsvp ? '#0E1113' : pressed ? theme.colors.accentPressed : theme.colors.fill,
                alignItems: 'center',
                justifyContent: 'center',
              })}>
              {joining ? (
                <ActivityIndicator color={theme.colors.onFill} />
              ) : (
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: myRsvp ? '#A8E05F' : theme.colors.onFill }}>{rsvpLabel}</Text>
              )}
            </Pressable>
          </View>
          <ReportSheet
            visible={reportOpen}
            onClose={() => setReportOpen(false)}
            onSubmit={async (reason, details) => {
              await reportUser(client, { reason, details, reportedEventId: event.id, reportedUserId: event.creator_id });
            }}
          />
        </>
      )}
      <StandaloneNavPill active="events" />
    </Screen>
  );
}
