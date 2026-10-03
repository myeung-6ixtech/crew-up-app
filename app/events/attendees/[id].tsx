import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAirlines } from '@/components/crew/airline';
import { CrewAvatar, PushedTopBar } from '@/components/crew/kit';
import { CapacityBar, meetState } from '@/components/events/host';
import { StandaloneNavPill } from '@/components/navigation/FloatingTabBar';
import { Screen, Toast } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { fetchEvent, removeAttendee } from '@/services/eventService';
import { fontFamily, useTheme } from '@/theme';

type Profile = {
  display_name?: string | null;
  preferred_name?: string | null;
  avatar_file_id?: string | null;
  crew_role?: string | null;
  role_type?: string | null;
  airline_id?: string | null;
};

type Attendee = { id: string; user_id: string; status: string; user?: { profile?: Profile } };

type EventDetail = {
  id: string;
  title: string;
  starts_at: string;
  capacity?: number | null;
  creator_id: string;
  rsvp_closed_at?: string | null;
  cancelled_at?: string | null;
  creator?: { id: string; profile?: Profile | null } | null;
  attendees?: Attendee[];
};

/** Host first, then everyone going. Remove is one person at a time; they can't RSVP to this meet again. */
export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const airlines = useAirlines();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setEvent(await fetchEvent(client, id));
  }, [client, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const name = (profile?: Profile | null) => profile?.preferred_name || profile?.display_name || t('home.crewMember');
  const subtitle = (profile?: Profile | null) =>
    [
      profile?.airline_id ? airlines.get(profile.airline_id)?.name : null,
      profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : profile?.role_type,
    ]
      .filter(Boolean)
      .join(' · ');

  const isHost = Boolean(event && event.creator_id === userId);
  const cancelled = event ? meetState(event) === 'cancelled' : false;
  const going = (event?.attendees ?? []).filter((attendee) => attendee.status === 'going' && attendee.user_id !== event?.creator_id);
  const goingCount = (event?.attendees ?? []).filter((attendee) => attendee.status === 'going').length;
  const spots = event?.capacity ? Math.max(0, event.capacity - goingCount) : null;
  const when = event ? new Date(event.starts_at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  const confirmRemove = (attendee: Attendee) => {
    const person = name(attendee.user?.profile);
    hapticWarning();
    Alert.alert(t('eventHost.removeTitle', { name: person }), t('eventHost.removeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('eventHost.remove'),
        style: 'destructive',
        onPress: async () => {
          setRemoving(attendee.id);
          try {
            await removeAttendee(client, attendee.id);
            hapticSuccess();
            setToast(t('eventHost.removedToast', { name: person.split(' ')[0] }));
            await load();
          } catch {
            hapticError();
            setToast(t('onboarding.genericError'));
          } finally {
            setRemoving(null);
          }
        },
      },
    ]);
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar title={t('events.attendees')} onBack={() => router.back()} />
      </View>
      {!event ? (
        <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 80 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 120 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 18 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 27, letterSpacing: -0.7, color: theme.colors.textPrimary }}>
              {cancelled ? t('eventHost.wereGoing', { count: goingCount }) : t('eventHost.goingCount', { count: goingCount })}
            </Text>
            {spots !== null && !cancelled ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary }}>{t('eventHost.spotsLeft', { count: spots })}</Text>
            ) : null}
          </View>
          {event.capacity ? (
            <View style={{ marginTop: 10 }}>
              <CapacityBar going={goingCount} capacity={event.capacity} />
            </View>
          ) : null}
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary, marginTop: 8 }}>{`${event.title} · ${when}`}</Text>

          <MonoLabel style={{ fontSize: 10.5, marginTop: 22 }}>{t('events.host')}</MonoLabel>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(SCREENS.network.user(event.creator_id))}
            disabled={isHost}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline }}>
            <CrewAvatar size={44} name={name(event.creator?.profile)} fileId={event.creator?.profile?.avatar_file_id} seed={event.creator_id} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
                {isHost ? t('eventHost.you', { name: name(event.creator?.profile) }) : name(event.creator?.profile)}
              </Text>
              {subtitle(event.creator?.profile) ? (
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>{subtitle(event.creator?.profile)}</Text>
              ) : null}
            </View>
          </Pressable>

          <MonoLabel style={{ fontSize: 10.5, marginTop: 20 }}>{t('events.going')}</MonoLabel>
          {going.length ? (
            going.map((attendee) => (
              <View
                key={attendee.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(SCREENS.network.user(attendee.user_id))}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <CrewAvatar size={44} name={name(attendee.user?.profile)} fileId={attendee.user?.profile?.avatar_file_id} seed={attendee.user_id} />
                  <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                    <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
                      {name(attendee.user?.profile)}
                    </Text>
                    {subtitle(attendee.user?.profile) ? (
                      <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
                        {subtitle(attendee.user?.profile)}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
                {isHost && !cancelled ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t('eventHost.remove')} ${name(attendee.user?.profile)}`}
                    disabled={removing === attendee.id}
                    onPress={() => confirmRemove(attendee)}
                    style={({ pressed }) => ({
                      height: 32,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: '#C9CEC1',
                      justifyContent: 'center',
                      opacity: pressed || removing === attendee.id ? 0.6 : 1,
                    })}>
                    {removing === attendee.id ? (
                      <ActivityIndicator color={theme.colors.textPrimary} />
                    ) : (
                      <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 12.5, color: theme.colors.textPrimary }}>{t('eventHost.remove')}</Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary, paddingVertical: 14 }}>{t('eventHost.noOneYet')}</Text>
          )}
          {isHost && !cancelled ? (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, lineHeight: 18, color: theme.colors.textTertiary, marginTop: 12 }}>
              {t('eventHost.removeFootnote')}
            </Text>
          ) : null}
        </ScrollView>
      )}
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
      <StandaloneNavPill active="events" />
    </Screen>
  );
}
