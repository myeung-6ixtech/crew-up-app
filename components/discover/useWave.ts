import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { ConnectionRequestError, fetchConnections, requestConnection } from '@/services/connectionService';
import { fetchMyWaves, postLayoverNudge } from '@/services/messagingService';
import type { TripMatchEntry } from '@/types/trip';
import { waveMetaFromMatch, waveNudgeKey } from './wave';

type ConnectionRow = { requester_id: string; addressee_id: string; status: string };

/**
 * Wave on a layover.
 * Someone you are not connected to gets a friend request. When they accept, that wave
 * is copied into the new chat. A friend gets a nudge in the chat you already share.
 * One nudge per overlap. A request already sent stays Waved.
 */
export function useWave(onToast: (message: string) => void) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [waving, setWaving] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!userId) return;
    void fetchConnections(client, userId)
      .then((rows: ConnectionRow[]) => {
        const pending = new Set<string>();
        const accepted = new Set<string>();
        for (const row of rows) {
          const otherId = row.requester_id === userId ? row.addressee_id : row.requester_id;
          if (row.status === 'accepted') accepted.add(otherId);
          else if (row.status === 'pending' && row.requester_id === userId) pending.add(otherId);
        }
        setRequested(pending);
        setFriends(accepted);
      })
      .catch(() => undefined);
    void fetchMyWaves(client, userId)
      .then((rows) => setNudged(new Set(rows.map((row) => waveNudgeKey(row.other_id, row.overlap_key)))))
      .catch(() => undefined);
  }, [client, userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isWaved = useCallback(
    (match: TripMatchEntry) => {
      const otherId = match.matched_user_id;
      if (requested.has(otherId)) return true;
      const meta = waveMetaFromMatch(match);
      return friends.has(otherId) && nudged.has(waveNudgeKey(otherId, meta.overlap_key));
    },
    [friends, nudged, requested],
  );

  const markNudged = useCallback((otherId: string, overlapKey: string) => {
    setNudged((current) => new Set(current).add(waveNudgeKey(otherId, overlapKey)));
    setFriends((current) => new Set(current).add(otherId));
    setRequested((current) => {
      const next = new Set(current);
      next.delete(otherId);
      return next;
    });
  }, []);

  const nudge = useCallback(
    async (otherId: string, meta: ReturnType<typeof waveMetaFromMatch>) => {
      await postLayoverNudge(client, otherId, meta);
      hapticSuccess();
      markNudged(otherId, meta.overlap_key);
      onToast(t('messages.waveSent'));
    },
    [client, markNudged, onToast, t],
  );

  const wave = useCallback(
    async (match: TripMatchEntry) => {
      const otherId = match.matched_user_id;
      const meta = waveMetaFromMatch(match);
      setWaving(otherId);
      try {
        if (friends.has(otherId)) {
          await nudge(otherId, meta);
          return;
        }
        const result = await requestConnection(client, otherId, t('home.waveMessage'), meta);
        if (result.outcome === 'accepted') {
          await nudge(otherId, meta);
          return;
        }
        hapticSuccess();
        setRequested((current) => new Set(current).add(otherId));
        onToast(t('friends.requestSentToast'));
      } catch (e) {
        if (e instanceof ConnectionRequestError && e.code === 'ALREADY_FRIENDS') {
          try {
            await nudge(otherId, meta);
            return;
          } catch {
            hapticError();
            onToast(t('onboarding.genericError'));
            return;
          }
        }
        hapticError();
        onToast(e instanceof ConnectionRequestError && e.code === 'BLOCKED' ? t('friends.requestBlocked') : t('onboarding.genericError'));
      } finally {
        setWaving(null);
      }
    },
    [client, friends, nudge, onToast, t],
  );

  return { isWaved, waving, wave };
}
