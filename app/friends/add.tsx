import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import {
  Screen,
  BodyText,
  SectionLabel,
  Toast,
  SearchInputField,
} from '@/components/ui';
import { SuggestedFriendsCarousel } from '@/components/friends/SuggestedFriendsCarousel';
import { SuggestedFriendsSkeleton } from '@/components/friends/SuggestedFriendsSkeleton';
import { FriendUserRow } from '@/components/friends/FriendUserRow';
import { FriendUserRowSkeleton } from '@/components/friends/FriendUserRowSkeleton';
import { formatFriendId, normalizeFriendId } from '@/lib/friendId';
import {
  ConnectionRequestError,
  fetchDiscoverableUsers,
  lookupByFriendId,
  requestConnectionByFriendId,
  type FriendProfilePreview,
  type SuggestedProfile,
} from '@/services/connectionService';
import { useAuth } from '@/hooks/useSession';
import { useThemedStyles } from '@/theme';

export default function AddFriendScreen() {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { userId } = useAuth();
  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl },
    section: { marginBottom: t.spacing.xl },
    searchSection: { marginBottom: t.spacing.lg },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: t.spacing.xl,
      paddingHorizontal: t.spacing.md,
      gap: t.spacing.xs,
    },
    emptyTitle: {
      ...t.typography.bodyStrong,
      color: t.colors.textPrimary,
      textAlign: 'center',
    },
  }));

  const [code, setCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [preview, setPreview] = useState<FriendProfilePreview | null>(null);
  const [sent, setSent] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedProfile[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);

  const loadSuggested = useCallback(async () => {
    if (!userId) return;
    setSuggestedLoading(true);
    try {
      setSuggested(await fetchDiscoverableUsers(client, userId));
    } finally {
      setSuggestedLoading(false);
    }
  }, [client, userId]);

  useEffect(() => {
    void loadSuggested();
  }, [loadSuggested]);

  const runLookup = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      setHasSearched(true);

      if (!trimmed) {
        setPreview(null);
        setSearchError('');
        setHasSearched(false);
        return;
      }

      const normalized = normalizeFriendId(trimmed);
      if (!normalized) {
        setPreview(null);
        setSearchError('');
        setLookupLoading(false);
        return;
      }

      setLookupLoading(true);
      setSearchError('');
      setPreview(null);
      setSent(false);

      try {
        setPreview(await lookupByFriendId(trimmed));
      } catch (e) {
        setPreview(null);
        if (e instanceof ConnectionRequestError && e.code === 'NOT_FOUND') {
          setSearchError('');
        } else {
          setSearchError(e instanceof Error ? e.message : t('common.error'));
        }
      } finally {
        setLookupLoading(false);
      }
    },
    [t],
  );

  const onSendRequest = async () => {
    if (!preview || sent || sending) return;

    setSending(true);
    setSearchError('');

    try {
      await requestConnectionByFriendId(code.trim(), t('friends.sendRequestMessage'));
      setSent(true);
      setToastVisible(true);
      setSuggested((current) => current.filter((item) => item.user_id !== preview.user_id));
    } catch (e) {
      if (e instanceof ConnectionRequestError) {
        if (e.code === 'ALREADY_FRIENDS') {
          setSearchError(t('friends.alreadyFriends'));
        } else if (e.code === 'BLOCKED') {
          setSearchError(t('friends.requestBlocked'));
        } else if (e.code === 'SELF_INVITE') {
          setSearchError(t('friends.selfInvite'));
        } else {
          setSearchError(e.message);
        }
      } else {
        setSearchError(e instanceof Error ? e.message : t('common.error'));
      }
    } finally {
      setSending(false);
    }
  };

  const onRequestSent = useCallback((requestedUserId: string) => {
    setSuggested((current) => current.filter((item) => item.user_id !== requestedUserId));
    setToastVisible(true);
  }, []);

  const showSearchEmpty =
    hasSearched &&
    !lookupLoading &&
    !preview &&
    !searchError &&
    Boolean(code.trim()) &&
    Boolean(normalizeFriendId(code));

  return (
    <Screen style={{ padding: 0 }}>
      <Toast
        message={t('friends.requestSentToast')}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          {suggestedLoading ? (
            <SuggestedFriendsSkeleton />
          ) : suggested.length > 0 ? (
            <SuggestedFriendsCarousel
              profiles={suggested}
              client={client}
              onRequestSent={onRequestSent}
            />
          ) : (
            <>
              <SectionLabel>{t('friends.suggested')}</SectionLabel>
              <BodyText muted>{t('friends.suggestedEmptyHint')}</BodyText>
            </>
          )}
        </View>

        <View style={styles.searchSection}>
          <SearchInputField
            value={code}
            onChangeText={(next) => {
              setCode(next);
              if (!next.trim()) {
                setPreview(null);
                setSearchError('');
                setSent(false);
                setHasSearched(false);
              }
            }}
            onSearch={() => void runLookup(code)}
            placeholder={t('friends.crewIdSearchPlaceholder')}
            error={searchError || undefined}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {lookupLoading ? <FriendUserRowSkeleton /> : null}

          {!lookupLoading && preview ? (
            <FriendUserRow
              userId={preview.user_id}
              displayName={preview.display_name}
              roleType={preview.role_type}
              baseAirport={preview.base_airport}
              avatarFileId={preview.avatar_file_id}
              subtitle={`${t('friends.crewId')}: ${preview.friend_id_display ?? formatFriendId(preview.friend_id)}`}
              actionLabel={sent ? t('friends.requestSent') : t('friends.sendRequest')}
              actionLoading={sending}
              actionDisabled={sent}
              onAction={() => void onSendRequest()}
            />
          ) : null}

          {showSearchEmpty ? (
            <View style={styles.emptyWrap}>
              <BodyText style={styles.emptyTitle}>{t('friends.searchNoResults')}</BodyText>
              <BodyText muted style={{ textAlign: 'center' }}>{t('friends.searchNoResultsHint')}</BodyText>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
