import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useAirlines } from '@/components/crew/airline';
import { CrewAvatar } from '@/components/crew/kit';
import { personName } from '@/components/crew/people';
import { CloseGlyph } from '@/components/crew/qrGlyphs';
import { SCREENS } from '@/constants/screens';
import { findAirportByIata } from '@/constants/airports';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import {
  ConnectionRequestError,
  lookupCrewCode,
  requestConnection,
  type CrewRelationship,
  type FriendProfilePreview,
} from '@/services/connectionService';
import { ensureDirectThread } from '@/services/messagingService';
import { fontFamily, useTheme } from '@/theme';

type State =
  | { kind: 'loading' }
  | { kind: 'found'; profile: FriendProfilePreview; relationship: CrewRelationship }
  /** A code that can't lead to a request: unknown, blocked, or a lookup that failed. */
  | { kind: 'problem'; message: string };

/**
 * Add friend after a Crew QR scan (or a crewup.app/c/… link): who it is, without their Crew ID, then one action.
 * Add friend sends a request; already friends offers Message; a pending request reads "Request pending", or
 * "Accept request" when they asked you. Your own code and a blocked code say so. Cancel goes back to the scanner.
 */
export default function FoundByQrScreen() {
  const { crewId } = useLocalSearchParams<{ crewId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  const client = useApolloClient();
  const airlines = useAirlines();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    if (!crewId) {
      setState({ kind: 'problem', message: t('friends.notCrewCode') });
      return;
    }
    lookupCrewCode(crewId)
      .then(({ profile, relationship }) => {
        if (active) setState({ kind: 'found', profile, relationship });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const code = error instanceof ConnectionRequestError ? error.code : '';
        setState({
          kind: 'problem',
          message: code === 'BLOCKED' ? t('friends.codeUnusable') : code === 'NOT_FOUND' ? t('friends.codeNotFound') : t('onboarding.genericError'),
        });
      });
    return () => {
      active = false;
    };
  }, [crewId, t]);

  const cancel = () => (router.canGoBack() ? router.back() : router.replace(SCREENS.tabs.friends));

  const addFriend = async (profile: FriendProfilePreview) => {
    setBusy(true);
    try {
      const result = await requestConnection(client, profile.user_id);
      hapticSuccess();
      if (result.outcome === 'accepted' || result.outcome === 'already_friends') {
        setState({ kind: 'found', profile, relationship: 'friends' });
      } else {
        setSent(true);
      }
    } catch (error) {
      hapticError();
      const code = error instanceof ConnectionRequestError ? error.code : '';
      if (code === 'ALREADY_FRIENDS') setState({ kind: 'found', profile, relationship: 'friends' });
      else if (code === 'BLOCKED') setState({ kind: 'problem', message: t('friends.codeUnusable') });
      else if (code === 'RATE_LIMITED') setState({ kind: 'problem', message: t('friends.tooManyRequests') });
      else setState({ kind: 'problem', message: t('onboarding.genericError') });
    } finally {
      setBusy(false);
    }
  };

  const message = async (profile: FriendProfilePreview) => {
    setBusy(true);
    try {
      const threadId = await ensureDirectThread(profile.user_id);
      router.replace(SCREENS.messages.thread(threadId, profile.user_id));
    } catch {
      hapticError();
    } finally {
      setBusy(false);
    }
  };

  const primary = (label: string, onPress?: () => void, done = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: done || !onPress, busy }}
      disabled={done || !onPress || busy}
      onPress={() => {
        hapticImpact();
        onPress?.();
      }}
      style={({ pressed }) => ({
        height: 54,
        borderRadius: 27,
        backgroundColor: done || !onPress ? theme.colors.field : theme.colors.fill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}>
      {busy ? (
        <ActivityIndicator color={theme.colors.onFill} />
      ) : (
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: done || !onPress ? theme.colors.textSecondary : theme.colors.onFill }}>{label}</Text>
      )}
    </Pressable>
  );

  const body = () => {
    if (state.kind === 'loading') return <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 80 }} />;
    if (state.kind === 'problem') {
      return (
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, lineHeight: 27, color: theme.colors.textPrimary, textAlign: 'center', marginTop: 80 }}>
          {state.message}
        </Text>
      );
    }
    const { profile, relationship } = state;
    const name = personName(profile, t('home.crewMember'));
    const role = profile.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : profile.role_type;
    const airline = profile.airline_id ? airlines.get(profile.airline_id)?.name : null;
    const baseCode = profile.base_airport_iata ?? profile.base_airport;
    const base = baseCode ? [baseCode, findAirportByIata(baseCode)?.city].filter(Boolean).join(' · ') : null;
    const line = [role, airline, baseCode].filter(Boolean).join(' · ');
    const self = relationship === 'self';
    return (
      <View style={{ alignItems: 'center', gap: 8, marginTop: 28 }}>
        <MonoLabel
          style={{ fontSize: 10, color: theme.colors.accentText, backgroundColor: theme.colors.accentSubtle, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, overflow: 'hidden' }}>
          {t('friends.foundByQr')}
        </MonoLabel>
        <View style={{ marginTop: 14 }}>
          <CrewAvatar name={name} fileId={profile.avatar_file_id} seed={profile.user_id} size={112} />
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 26, letterSpacing: -0.5, color: theme.colors.textPrimary, marginTop: 8, textAlign: 'center' }}>
          {name}
        </Text>
        {line ? (
          <Text accessibilityLabel={[role, airline, base].filter(Boolean).join(', ')} style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
            {line}
          </Text>
        ) : null}
        {self || relationship === 'friends' ? (
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interMedium, fontSize: 14.5, color: theme.colors.textPrimary, marginTop: 10 }}>
            {self ? t('friends.ownCode') : t('friends.qrAlreadyFriends')}
          </Text>
        ) : null}
      </View>
    );
  };

  const actions = () => {
    if (state.kind !== 'found') return null;
    const { profile, relationship } = state;
    if (relationship === 'self') return null;
    if (relationship === 'friends') return primary(t('chat.message'), () => void message(profile));
    if (relationship === 'pending_sent' || sent) return primary(sent ? t('friends.requestSentQr') : t('friends.requestPending'), undefined, true);
    if (relationship === 'pending_received') return primary(t('friends.acceptRequest'), () => void addFriend(profile));
    return primary(t('friends.addFriend'), () => void addFriend(profile));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.ground, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <View style={{ alignItems: 'flex-start' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={cancel}
          hitSlop={6}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <CloseGlyph color={theme.colors.textPrimary} />
        </Pressable>
      </View>
      <View style={{ flex: 1 }}>{body()}</View>
      <View style={{ gap: 6 }}>
        {actions()}
        <Pressable accessibilityRole="button" onPress={cancel} style={({ pressed }) => ({ height: 48, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
