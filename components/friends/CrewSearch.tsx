import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, Easing, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { CrewAvatar } from '@/components/crew/kit';
import { MonoLabel, SearchGlyph } from '@/features/onboarding/components/kit';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatFriendId, normalizeFriendId } from '@/lib/friendId';
import { hapticError, hapticImpact, hapticSelection, hapticSuccess } from '@/lib/haptics';
import { ConnectionRequestError, requestConnection } from '@/services/connectionService';
import { searchCrew, type CrewSearchResult, type CrewSearchType, type FriendshipStatus } from '@/services/crewSearchService';
import { fontFamily, useTheme } from '@/theme';

const SEARCH_DEBOUNCE_MS = 300;
/** The skeleton stays at least this long so it doesn't flash on and off. */
const MIN_SKELETON_MS = 400;
const INK = '#0E1113';
const GROUND = '#F7F8F4';
const TRACK = '#EAECE5';

/** What makes a query worth searching: 2+ characters, or a complete Crew ID. */
function searchable(type: CrewSearchType, query: string): string | null {
  if (type === 'crew_id') return normalizeFriendId(query);
  const term = query.trim().replace(/^@+/, '');
  return term.length >= 2 ? term : null;
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => subscription.remove();
  }, []);
  return reduce;
}

/** [@Username] [Crew ID]: grey track, the selected option in ink. */
function SearchTypeSwitch({ value, onChange }: { value: CrewSearchType; onChange: (type: CrewSearchType) => void }) {
  const { t } = useTranslation();
  const options: { value: CrewSearchType; label: string }[] = [
    { value: 'username', label: t('friends.search.byUsername') },
    { value: 'crew_id', label: t('friends.crewId') },
  ];
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: TRACK, borderRadius: 22, padding: 4, marginTop: 12 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              hapticSelection();
              onChange(option.value);
            }}
            style={{ flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? INK : 'transparent' }}>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: selected ? GROUND : INK }}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A lighter band sweeping across, like the design's 1.2s linear shimmer. Static grey with reduced motion. */
function Shimmer({ reduce }: { reduce: boolean }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reduce, x]);
  if (reduce) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '50%',
        backgroundColor: '#F4F5F1',
        opacity: 0.85,
        transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-220, 420] }) }],
      }}
    />
  );
}

function Bone({ width, height, radius, reduce }: { width: number | `${number}%`; height: number; radius: number; reduce: boolean }) {
  return (
    <View style={{ width, height, borderRadius: radius, backgroundColor: TRACK, overflow: 'hidden' }}>
      <Shimmer reduce={reduce} />
    </View>
  );
}

/** Same size as a result card: 52px circle, two bars (62% / 44%), a 96×36 pill. */
function SkeletonCard({ reduce, faded }: { reduce: boolean; faded?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: faded ? 0.6 : 1 }}>
      <Bone width={52} height={52} radius={26} reduce={reduce} />
      <View style={{ flex: 1, gap: 8 }}>
        <Bone width="62%" height={13} radius={7} reduce={reduce} />
        <Bone width="44%" height={11} radius={6} reduce={reduce} />
      </View>
      <Bone width={96} height={36} radius={18} reduce={reduce} />
    </View>
  );
}

function ResultCard({
  person,
  status,
  sending,
  onSend,
}: {
  person: CrewSearchResult;
  status: FriendshipStatus;
  sending: boolean;
  onSend: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const role = person.role ? t(`onboarding.crewRoles.${person.role}`, { defaultValue: person.role }) : null;
  // No Crew ID here, ever: just @handle · Role · Base.
  const subtitle = [person.handle ? `@${person.handle}` : null, role, person.base].filter(Boolean).join(' · ');
  const done = status === 'friends' || status === 'pending_sent';
  const label =
    status === 'friends' ? t('friends.search.friends') : status === 'pending_sent' ? t('friends.requestSentQr') : status === 'pending_received' ? t('friends.acceptRequest') : t('friends.sendRequest');
  return (
    <View
      accessible={false}
      style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <CrewAvatar name={person.displayName} fileId={person.avatarFileId} seed={person.id} size={52} />
      <View accessible accessibilityLabel={[person.displayName, subtitle].filter(Boolean).join(', ')} style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
          {person.displayName}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${person.displayName}`}
        accessibilityState={{ disabled: done, busy: sending }}
        disabled={done || sending}
        onPress={() => {
          hapticImpact();
          onSend();
        }}
        style={({ pressed }) => ({
          flexShrink: 0,
          height: 36,
          minWidth: 96,
          borderRadius: 18,
          paddingHorizontal: 14,
          backgroundColor: done ? theme.colors.field : theme.colors.fill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        })}>
        {sending ? (
          <ActivityIndicator color={theme.colors.onFill} />
        ) : (
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13, color: done ? theme.colors.textSecondary : theme.colors.onFill }}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}

/**
 * Find crew: by @username / name (2+ characters, partial) or by the exact Crew ID. Each type keeps its own query;
 * switching restores it and searches again. Results never show a Crew ID.
 */
export function CrewSearch({ onToast, onSent }: { onToast: (message: string) => void; onSent?: (userId: string) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const client = useApolloClient();
  const reduceMotion = useReduceMotion();
  const [type, setType] = useState<CrewSearchType>('username');
  const [queries, setQueries] = useState<Record<CrewSearchType, string>>({ username: '', crew_id: '' });
  const [results, setResults] = useState<CrewSearchResult[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, FriendshipStatus>>({});
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const seq = useRef(0);
  const query = queries[type];
  const term = searchable(type, query);

  useEffect(() => {
    const run = ++seq.current;
    if (!term) {
      setResults(null);
      setLoading(false);
      setFailed(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const startedAt = Date.now();
      setLoading(true);
      setFailed(false);
      AccessibilityInfo.announceForAccessibility(t('friends.search.searching'));
      void searchCrew(type, term, controller.signal)
        .then(async (found) => {
          const wait = MIN_SKELETON_MS - (Date.now() - startedAt);
          if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
          if (run !== seq.current) return; // a newer query took over
          setResults(found);
          setStatuses(Object.fromEntries(found.map((person) => [person.id, person.friendshipStatus])));
          AccessibilityInfo.announceForAccessibility(
            found.length ? t('friends.search.matches', { count: found.length }) : type === 'crew_id' ? t('friends.search.noCrewId') : t('friends.search.noUsername', { q: term }),
          );
        })
        .catch((error: unknown) => {
          if (run !== seq.current || (error instanceof Error && error.name === 'AbortError')) return;
          // Keep whatever was showing; just say the search didn't go through.
          setFailed(true);
        })
        .finally(() => {
          if (run === seq.current) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, type, t]);

  const setQuery = (value: string) => setQueries((current) => ({ ...current, [type]: value }));

  const onChangeText = (value: string) => {
    if (type === 'username') {
      setQuery(value.replace(/^@+/, ''));
      return;
    }
    // Crew ID: tidy into CREW-XXXX-XXXX once complete; partial codes stay as typed.
    const normalized = normalizeFriendId(value);
    setQuery(normalized ? formatFriendId(normalized) : value.toUpperCase());
  };

  const send = async (person: CrewSearchResult) => {
    setSendingTo(person.id);
    try {
      const result = await requestConnection(client, person.id, t('friends.sendRequestMessage'));
      hapticSuccess();
      const next: FriendshipStatus = result.outcome === 'accepted' || result.outcome === 'already_friends' ? 'friends' : 'pending_sent';
      setStatuses((current) => ({ ...current, [person.id]: next }));
      onSent?.(person.id);
      onToast(next === 'friends' ? t('profile.nowFriends') : t('friends.search.requestSent'));
    } catch (e) {
      hapticError();
      if (e instanceof ConnectionRequestError && e.code === 'ALREADY_FRIENDS') setStatuses((current) => ({ ...current, [person.id]: 'friends' }));
      else onToast(e instanceof ConnectionRequestError && e.code === 'BLOCKED' ? t('friends.requestBlocked') : t('friends.search.failed'));
    } finally {
      setSendingTo(null);
    }
  };

  const isId = type === 'crew_id';
  const empty = Boolean(term) && !loading && results !== null && results.length === 0;

  return (
    <View>
      <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary, marginTop: 28 }}>
        {t('friends.search.title')}
      </Text>
      <SearchTypeSwitch value={type} onChange={setType} />

      <View
        style={{
          height: 52,
          borderRadius: 26,
          backgroundColor: focused ? theme.colors.card : theme.colors.field,
          borderWidth: 2,
          borderColor: focused ? theme.colors.ink : theme.colors.field,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 18,
          marginTop: 12,
        }}>
        <SearchGlyph />
        {isId ? null : (
          <Text accessibilityElementsHidden importantForAccessibility="no" style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textTertiary }}>
            @
          </Text>
        )}
        <TextInput
          key={type}
          value={query}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          placeholder={isId ? 'CREW-XXXX-XXXX' : t('friends.search.usernamePlaceholder')}
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel={isId ? t('friends.search.byCrewIdA11y') : t('friends.search.byUsernameA11y')}
          autoCapitalize={isId ? 'characters' : 'none'}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          textContentType="none"
          style={{
            flex: 1,
            padding: 0,
            fontSize: 15,
            color: theme.colors.textPrimary,
            fontFamily: isId ? fontFamily.monoMedium : fontFamily.interRegular,
            letterSpacing: isId ? 0.6 : 0,
          }}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('friends.search.clear')}
            hitSlop={8}
            onPress={() => setQuery('')}
            style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.hairline, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={9} height={9} viewBox="0 0 10 10">
              <Path d="M1 1l8 8M9 1L1 9" stroke={theme.colors.textPrimary} strokeWidth={1.8} strokeLinecap="round" />
            </Svg>
          </Pressable>
        ) : null}
      </View>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 8, paddingLeft: 4 }}>
        {isId ? t('friends.search.crewIdHelp') : t('friends.search.usernameHelp')}
      </Text>

      {failed ? (
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 10, paddingLeft: 4 }}>
          {t('friends.search.failed')}
        </Text>
      ) : null}

      {loading ? (
        <View style={{ marginTop: 14, gap: 10 }}>
          <View accessibilityRole="text" accessibilityLiveRegion="polite">
            <MonoLabel style={{ fontSize: 10.5 }}>{t('friends.search.searching')}</MonoLabel>
          </View>
          <SkeletonCard reduce={reduceMotion} />
          <SkeletonCard reduce={reduceMotion} faded />
        </View>
      ) : results && results.length ? (
        <View style={{ marginTop: 14, gap: 10 }}>
          <MonoLabel style={{ fontSize: 10.5 }}>{t('friends.search.matches', { count: results.length })}</MonoLabel>
          {results.map((person) => (
            <ResultCard
              key={person.id}
              person={person}
              status={statuses[person.id] ?? person.friendshipStatus}
              sending={sendingTo === person.id}
              onSend={() => void send(person)}
            />
          ))}
        </View>
      ) : empty ? (
        <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 18, marginTop: 14 }}>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, textAlign: 'center' }}>
            {isId ? t('friends.search.noCrewId') : t('friends.search.noUsername', { q: term })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
