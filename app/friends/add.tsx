import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { CrewSearch } from '@/components/friends/CrewSearch';
import { CrewAvatar, PushedTopBar } from '@/components/crew/kit';
import { personRoleBase } from '@/components/crew/people';
import { StandaloneNavPill } from '@/components/navigation/FloatingTabBar';
import { Screen, Toast } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import {
  ConnectionRequestError,
  fetchSuggestedFriends,
  requestConnection,
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

/** Two doors into the same request: a sideways row of suggested crew, then Find crew (by @username or Crew ID). */
export default function AddFriendScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useScreenInsets();
  const client = useApolloClient();
  const { userId, profile } = useAuth();
  const base = profile?.base_airport_iata ?? profile?.base_airport ?? null;

  const [suggested, setSuggested] = useState<SuggestedProfile[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!userId) return;
    setSuggestedLoading(true);
    void fetchSuggestedFriends(client, userId, base)
      .then(setSuggested)
      .catch(() => setSuggested([]))
      .finally(() => setSuggestedLoading(false));
  }, [base, client, userId]);

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

        <CrewSearch
          onToast={setToast}
          onSent={(sentId) => setSuggested((current) => current.filter((item) => item.user_id !== sentId))}
        />
      </ScrollView>
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
      <StandaloneNavPill active="friends" />
    </Screen>
  );
}
