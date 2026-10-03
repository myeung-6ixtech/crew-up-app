import { useCallback, useEffect, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleButton, CrewAvatar, PillGroup, PushedTopBar } from '@/components/crew/kit';
import { CrewUpEventBadge, eventTagNames } from '@/components/events/EventCard';
import {
  ClosureBanner,
  CloseMeetSheet,
  DotsGlyph,
  EventLocation,
  HostControls,
  StateChip,
  VenueChip,
  meetState,
  stateChipTone,
} from '@/components/events/host';
import { NAV_PILL_HEIGHT, StandaloneNavPill } from '@/components/navigation/FloatingTabBar';
import { ReportSheet } from '@/components/ReportSheet';
import { Screen, Toast } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { fetchEvent, rsvpEvent, setEventClosure } from '@/services/eventService';
import { reportUser } from '@/services/safetyService';
import { fontFamily, useTheme } from '@/theme';
import type { EventItem } from '@/types/domain';

type PersonProfile = {
  display_name?: string | null;
  preferred_name?: string | null;
  avatar_file_id?: string | null;
};

type Attendee = {
  id: string;
  user_id: string;
  status: string;
  user?: { profile?: PersonProfile };
};

type EventDetail = EventItem & {
  description?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  rsvp_closed_at?: string | null;
  cancelled_at?: string | null;
  creator?: { id: string; profile?: PersonProfile | null } | null;
  attendees?: Attendee[];
};

function personName(profile?: PersonProfile | null) {
  return profile?.preferred_name || profile?.display_name || '';
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : name;
}

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

function AvatarStack({ attendees, size, ring }: { attendees: Attendee[]; size: number; ring: string }) {
  if (!attendees.length) return null;
  const shown = attendees.slice(0, 3);
  return (
    <View style={{ flexDirection: 'row' }}>
      {shown.map((attendee, index) => (
        <View
          key={attendee.id}
          style={{ marginRight: index < shown.length - 1 ? -Math.round(size / 3.5) : 0, borderWidth: 2, borderColor: ring, borderRadius: size }}>
          <CrewAvatar size={size} name={personName(attendee.user?.profile)} fileId={attendee.user?.profile?.avatar_file_id} seed={attendee.user_id} />
        </View>
      ))}
    </View>
  );
}

/**
 * The meet. Guests read it, RSVP, or report it; Going does not let them leave here.
 * The host sees Host controls instead of RSVP: edit, attendees, and close (stop RSVPs or cancel).
 */
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
  const [closeOpen, setCloseOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setEvent(await fetchEvent(client, id));
  }, [client, id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Coming back from Edit or Attendees picks up their changes.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const myRsvp = event?.attendees?.find((attendee) => attendee.user_id === userId);
  const going = (event?.attendees ?? []).filter((attendee) => attendee.status === 'going');
  const hostName = personName(event?.creator?.profile);
  const hostId = event?.creator?.id ?? event?.creator_id;
  const platform = event?.host_type === 'platform';
  const isHost = Boolean(event && userId && event.creator_id === userId && !platform);
  const state = event ? meetState(event) : 'open';
  const { activities, interests } = event ? eventTagNames(event) : { activities: [], interests: [] };
  const venue = [event?.venue_name, event?.venue_address].filter(Boolean).join(' · ');
  const spots = event?.capacity ? Math.max(0, event.capacity - going.length) : null;

  const rsvp = async () => {
    if (!userId || !event) return;
    setJoining(true);
    try {
      await rsvpEvent(client, event.id, userId);
      hapticSuccess();
      await load();
    } catch (e) {
      hapticError();
      const message = e instanceof Error ? e.message : '';
      setToast(
        message.includes('EVENT_RSVPS_CLOSED')
          ? t('eventHost.guestClosedShort')
          : message.includes('EVENT_CANCELLED')
            ? t('eventHost.guestCancelled')
            : message.includes('ATTENDEE_REMOVED')
              ? t('eventHost.youWereRemoved')
              : t('onboarding.genericError'),
      );
    } finally {
      setJoining(false);
    }
  };

  const close = async (choice: 'rsvps_closed' | 'cancelled') => {
    if (!event) return;
    setClosing(true);
    try {
      await setEventClosure(client, event.id, choice);
      hapticSuccess();
      setReopened(false);
      setCloseOpen(false);
      setToast(choice === 'cancelled' ? t('eventHost.cancelledToast', { count: going.length }) : t('eventHost.closedToast'));
      await load();
    } catch {
      hapticError();
      setToast(t('onboarding.genericError'));
    } finally {
      setClosing(false);
    }
  };

  const reopen = async () => {
    if (!event) return;
    try {
      await setEventClosure(client, event.id, 'reopened');
      hapticSuccess();
      setReopened(true);
      setToast(t('eventHost.reopenedToast'));
      await load();
    } catch {
      hapticError();
      setToast(t('onboarding.genericError'));
    }
  };

  const openEdit = () => event && router.push(SCREENS.events.edit(event.id));
  const openAttendees = () => event && router.push(SCREENS.events.attendees(event.id));

  const openHostMenu = () => {
    const actions: { label: string; run: () => void; destructive?: boolean }[] = [];
    if (state !== 'cancelled') actions.push({ label: t('eventHost.edit'), run: openEdit });
    actions.push({ label: t('events.attendees'), run: openAttendees });
    if (state === 'open') actions.push({ label: t('eventHost.close'), run: () => setCloseOpen(true), destructive: true });
    if (state === 'rsvps_closed') actions.push({ label: t('eventHost.reopen'), run: () => void reopen() });
    if (Platform.OS === 'ios') {
      const destructiveButtonIndex = actions.findIndex((action) => action.destructive);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...actions.map((action) => action.label), t('common.cancel')],
          cancelButtonIndex: actions.length,
          destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
        },
        (index) => actions[index]?.run(),
      );
    } else {
      Alert.alert(event?.title ?? '', undefined, [
        ...actions.map((action) => ({ text: action.label, onPress: action.run, style: action.destructive ? ('destructive' as const) : ('default' as const) })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ]);
    }
  };

  const hostBanner = () => {
    if (!isHost) return null;
    if (state === 'cancelled') {
      return <ClosureBanner tone="cancelled" title={t('eventHost.youCancelled')} body={t('eventHost.youCancelledBody', { count: going.length })} />;
    }
    if (state === 'rsvps_closed') {
      return <ClosureBanner tone="closed" title={t('eventHost.rsvpsClosed')} body={t('eventHost.rsvpsClosedBody', { count: going.length })} />;
    }
    if (reopened) {
      return (
        <ClosureBanner
          tone="open"
          title={t('eventHost.rsvpsOpenAgain')}
          body={spots !== null ? t('eventHost.spotsAvailable', { count: spots }) : t('eventHost.anyoneCanJoin')}
        />
      );
    }
    return null;
  };

  const guestBanner = () => {
    if (isHost || state === 'open') return null;
    if (state === 'cancelled') return <ClosureBanner tone="cancelled" body={t('eventHost.guestCancelled')} />;
    return <ClosureBanner tone="guest" body={myRsvp?.status === 'going' ? t('eventHost.guestClosed') : t('eventHost.guestClosedShort')} />;
  };

  const rsvpBlocked = !myRsvp && state !== 'open';
  const rsvpLabel = myRsvp
    ? myRsvp.status === 'going'
      ? `${t('events.going')} ✓`
      : myRsvp.status === 'removed'
        ? t('eventHost.removedLabel')
        : t('events.waitlisted')
    : state === 'cancelled'
      ? t('eventHost.cancelledLabel')
      : state === 'rsvps_closed'
        ? t('eventHost.closedLabel')
        : t('events.rsvp');

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar
          onBack={() => router.back()}
          right={
            !event ? null : isHost ? (
              <CircleButton accessibilityLabel={t('eventHost.more')} onPress={openHostMenu}>
                <DotsGlyph color={theme.colors.textPrimary} />
              </CircleButton>
            ) : (
              <Text
                accessibilityRole="button"
                onPress={() => setReportOpen(true)}
                style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: theme.colors.textPrimary }}>
                {t('safety.report')}
              </Text>
            )
          }
        />
      </View>
      {!event ? (
        <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 80 }} />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: isHost ? insets.bottom + NAV_PILL_HEIGHT + 40 : 24 }}>
            <View style={{ backgroundColor: '#0E1113', borderRadius: 24, padding: 20, marginTop: 14, gap: 10 }}>
              {isHost ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StateChip tone="lime" label={t('eventHost.youreHosting')} />
                  <StateChip tone={stateChipTone(state)} label={t(`eventHost.state.${state}`)} />
                </View>
              ) : platform || state !== 'open' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {state !== 'open' ? (
                    <StateChip tone={stateChipTone(state)} label={t(`eventHost.state.${state}`)} />
                  ) : (
                    <CrewUpEventBadge tone="lime" />
                  )}
                  <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: '#A7B1B5' }}>
                    {platform ? t('events.hostedByCrewUp') : hostName ? t('eventHost.hostedBy', { name: shortName(hostName) }) : ''}
                  </Text>
                </View>
              ) : null}
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: fontFamily.jakartaBold,
                  fontSize: 27,
                  lineHeight: 29,
                  letterSpacing: -0.7,
                  color: '#EDF1F2',
                  textDecorationLine: state === 'cancelled' ? 'line-through' : 'none',
                }}>
                {event.title}
              </Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: '#A7B1B5' }}>{`${event.city} · ${formatWhen(event.starts_at)}`}</Text>
            </View>

            {hostBanner()}
            {guestBanner()}

            {isHost ? (
              <HostControls
                state={state}
                going={going.length}
                capacity={event.capacity}
                attendeesPreview={<AvatarStack attendees={going} size={26} ring={theme.colors.card} />}
                onEdit={openEdit}
                onAttendees={openAttendees}
                onClose={() => setCloseOpen(true)}
                onReopen={() => void reopen()}
              />
            ) : null}

            {event.description ? (
              <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 16, marginTop: 16, gap: 6 }}>
                <MonoLabel style={{ fontSize: 10.5 }}>{t('events.notes')}</MonoLabel>
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>{event.description}</Text>
              </View>
            ) : null}

            <View style={{ gap: 14, marginTop: 16 }}>
              <PillGroup label={t('onboarding.review.activitiesSection')} names={activities} />
              <PillGroup label={t('onboarding.review.interestsSection')} names={interests} />
            </View>

            {isHost || state !== 'open' ? (
              venue ? <VenueChip venue={event.venue_name || venue} detail={event.venue_name ? event.venue_address : event.city} /> : null
            ) : event.venue_name || event.venue_address ? (
              <EventLocation venue={event.venue_name} address={event.venue_address} city={event.city} />
            ) : null}

            {!isHost ? (
              <View style={{ marginTop: 20, gap: 14 }}>
                <MonoLabel style={{ fontSize: 10.5 }}>{t('events.attendees')}</MonoLabel>
                {hostId ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <CrewAvatar size={40} name={hostName} fileId={event.creator?.profile?.avatar_file_id} seed={hostId} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: theme.colors.textPrimary }}>{hostName || t('events.host')}</Text>
                      {hostName ? (
                        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 12.5, color: theme.colors.accentText }}>{t('events.host')}</Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <AvatarStack attendees={going} size={30} ring={theme.colors.ground} />
                  <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary }}>
                    {t('events.attendingCount', { count: going.length })}
                  </Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {!isHost ? (
            <View style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: insets.bottom + NAV_PILL_HEIGHT + 24 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: Boolean(myRsvp) || rsvpBlocked, busy: joining }}
                disabled={Boolean(myRsvp) || rsvpBlocked || joining}
                onPress={() => {
                  hapticImpact();
                  void rsvp();
                }}
                style={({ pressed }) => ({
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: rsvpBlocked ? theme.colors.track : myRsvp ? '#0E1113' : pressed ? theme.colors.accentPressed : theme.colors.fill,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}>
                {joining ? (
                  <ActivityIndicator color={theme.colors.onFill} />
                ) : (
                  <Text
                    style={{
                      fontFamily: fontFamily.jakartaBold,
                      fontSize: 16,
                      color: rsvpBlocked ? theme.colors.textTertiary : myRsvp ? '#A8E05F' : theme.colors.onFill,
                    }}>
                    {rsvpLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <ReportSheet
            visible={reportOpen}
            onClose={() => setReportOpen(false)}
            onSubmit={async (reason, details) => {
              await reportUser(client, { reason, details, reportedEventId: event.id, reportedUserId: event.creator_id });
            }}
          />
          {isHost ? (
            <CloseMeetSheet visible={closeOpen} going={going.length} busy={closing} onClose={() => setCloseOpen(false)} onConfirm={(choice) => void close(choice)} />
          ) : null}
        </>
      )}
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
      <StandaloneNavPill active="events" />
    </Screen>
  );
}
