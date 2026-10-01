import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CrewAvatar, PushedTopBar } from '@/components/crew/kit';
import { personRoleBase } from '@/components/crew/people';
import { StandaloneNavPill } from '@/components/navigation/FloatingTabBar';
import { Screen, Toast } from '@/components/ui';
import { SearchGlyph } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatFriendId, normalizeFriendId } from '@/lib/friendId';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import {
  ConnectionRequestError,
  fetchDiscoverableUsers,
  lookupByFriendId,
  requestConnection,
  requestConnectionByFriendId,
  type FriendProfilePreview,
  type SuggestedProfile,
} from '@/services/connectionService';
import { fontFamily, useTheme } from '@/theme';

function SendButton({
  label,
  done,
  loading,
  onPress,
  height,
  stretch,
}: {
  label: string;
  done: boolean;
  loading: boolean;
  onPress: () => void;
  height: number;
  stretch?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: done, busy: loading }}
      disabled={done || loading}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        height,
        alignSelf: stretch ? 'stretch' : undefined,
        borderRadius: height / 2,
        paddingHorizontal: 14,
        backgroundColor: done ? theme.colors.field : theme.colors.fill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}>
      {loading ? (
        <ActivityIndicator color={theme.colors.onFill} />
      ) : (
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13, color: done ? theme.colors.textSecondary : theme.colors.onFill }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Two doors into the same request: a sideways row of suggested crew, then an exact Crew ID search. */
export default function AddFriendScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId, profile } = useAuth();

  const [suggested, setSuggested] = useState<SuggestedProfile[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [preview, setPreview] = useState<FriendProfilePreview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!userId) return;
    setSuggestedLoading(true);
    void fetchDiscoverableUsers(client, userId)
      .then(setSuggested)
      .catch(() => setSuggested([]))
      .finally(() => setSuggestedLoading(false));
  }, [client, userId]);

  const errorMessage = useCallback(
    (e: unknown) => {
      if (e instanceof ConnectionRequestError) {
        if (e.code === 'ALREADY_FRIENDS') return t('friends.alreadyFriends');
        if (e.code === 'BLOCKED') return t('friends.requestBlocked');
        if (e.code === 'SELF_INVITE') return t('friends.selfInvite');
        return e.message;
      }
      return e instanceof Error ? e.message : t('common.error');
    },
    [t],
  );

  const runLookup = useCallback(
    async (raw: string) => {
      setPreview(null);
      setNotFound(false);
      setSearchError('');
      setSent(false);
      // Partial codes stay quiet: nothing is called until the code is a full Crew ID.
      if (!normalizeFriendId(raw)) return;
      setLookupLoading(true);
      try {
        setPreview(await lookupByFriendId(raw.trim()));
      } catch (e) {
        if (e instanceof ConnectionRequestError && e.code === 'NOT_FOUND') setNotFound(true);
        else setSearchError(errorMessage(e));
      } finally {
        setLookupLoading(false);
      }
    },
    [errorMessage],
  );

  // A complete, well-formed code looks itself up; the keyboard's search key does the same.
  useEffect(() => {
    if (!normalizeFriendId(code)) {
      setPreview(null);
      setNotFound(false);
      setSearchError('');
      return undefined;
    }
    const timer = setTimeout(() => void runLookup(code), 300);
    return () => clearTimeout(timer);
  }, [code, runLookup]);

  const sendSuggested = async (person: SuggestedProfile) => {
    setSendingTo(person.user_id);
    try {
      await requestConnection(client, person.user_id, t('friends.sendRequestMessage'));
      hapticSuccess();
      setSuggested((current) => current.filter((item) => item.user_id !== person.user_id));
      setToast(t('friends.requestSentToast'));
    } catch (e) {
      hapticError();
      setToast(errorMessage(e));
    } finally {
      setSendingTo(null);
    }
  };

  const sendByCode = async () => {
    if (!preview || sent) return;
    setSending(true);
    setSearchError('');
    try {
      await requestConnectionByFriendId(code.trim(), t('friends.sendRequestMessage'));
      hapticSuccess();
      setSent(true);
      setSuggested((current) => current.filter((item) => item.user_id !== preview.user_id));
      setToast(t('friends.requestSentToast'));
    } catch (e) {
      hapticError();
      setSearchError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const base = profile?.base_airport_iata ?? profile?.base_airport;

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar title={t('friends.addFriend')} onBack={() => router.back()} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 120 }}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary, marginTop: 20 }}>
          {t('friends.suggested')}
        </Text>
        {base ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 }}>
            {t('friends.suggestedBaseFirst', { base })}
          </Text>
        ) : null}
        {suggestedLoading ? (
          <ActivityIndicator color={theme.colors.accentText} style={{ marginVertical: 40 }} />
        ) : suggested.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -24, marginTop: 12 }}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
            {suggested.map((person) => (
              <View
                key={person.user_id}
                style={{
                  width: 138,
                  backgroundColor: theme.colors.card,
                  borderRadius: 20,
                  paddingTop: 16,
                  paddingHorizontal: 12,
                  paddingBottom: 12,
                  alignItems: 'center',
                  gap: 4,
                }}>
                <View style={{ marginBottom: 4 }}>
                  <CrewAvatar name={person.display_name} fileId={person.avatar_file_id} seed={person.user_id} size={64} />
                </View>
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary }}>
                  {person.display_name}
                </Text>
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>
                  {personRoleBase(person, t)}
                </Text>
                <View style={{ marginTop: 8, alignSelf: 'stretch' }}>
                  <SendButton
                    height={34}
                    stretch
                    label={t('friends.sendRequest')}
                    done={false}
                    loading={sendingTo === person.user_id}
                    onPress={() => void sendSuggested(person)}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary, paddingVertical: 16 }}>
            {t('friends.suggestedEmptyHint')}
          </Text>
        )}

        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary, marginTop: 28 }}>
          {t('friends.addByCrewId')}
        </Text>
        <View
          style={{
            height: 52,
            borderRadius: 26,
            backgroundColor: focused ? theme.colors.card : theme.colors.field,
            borderWidth: 2,
            borderColor: focused ? theme.colors.ink : theme.colors.field,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 18,
            marginTop: 12,
          }}>
          <SearchGlyph />
          <TextInput
            value={code}
            onChangeText={setCode}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={() => void runLookup(code)}
            returnKeyType="search"
            placeholder={t('friends.crewIdSearchPlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            accessibilityLabel={t('friends.addByCrewId')}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            style={{ flex: 1, fontFamily: fontFamily.monoMedium, fontSize: 15, letterSpacing: 0.6, color: theme.colors.textPrimary, padding: 0 }}
          />
          {lookupLoading ? <ActivityIndicator color={theme.colors.accentText} /> : null}
        </View>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 8, paddingLeft: 4 }}>
          {t('friends.crewIdQuietHint')}
        </Text>

        {preview ? (
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: 18,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 12,
            }}>
            <CrewAvatar name={preview.display_name} fileId={preview.avatar_file_id} seed={preview.user_id} size={52} />
            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
                {preview.display_name}
              </Text>
              <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
                {personRoleBase(preview, t)}
              </Text>
              <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.accentText }}>
                {`${t('friends.crewId')}: ${preview.friend_id_display ?? formatFriendId(preview.friend_id)}`}
              </Text>
            </View>
            <SendButton
              height={36}
              label={sent ? t('friends.requestSent') : t('friends.sendRequest')}
              done={sent}
              loading={sending}
              onPress={() => void sendByCode()}
            />
          </View>
        ) : null}

        {notFound || searchError ? (
          <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 18, marginTop: 12 }}>
            <Text
              style={{
                fontFamily: fontFamily.interRegular,
                fontSize: 13.5,
                lineHeight: 20,
                color: searchError ? theme.colors.statusOnDuty : theme.colors.textSecondary,
                textAlign: 'center',
              }}>
              {searchError || `${t('friends.searchNoResults')}. ${t('friends.searchNoResultsHint')}`}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
      <StandaloneNavPill active="friends" />
    </Screen>
  );
}
