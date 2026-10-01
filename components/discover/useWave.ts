import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { ConnectionRequestError, fetchConnections, requestConnection } from '@/services/connectionService';

type ConnectionRow = { requester_id: string; addressee_id: string; status: string };

/**
 * Wave sends the crossing-paths friend request. It never opens a chat.
 * People already asked (or already friends) show as Waved.
 */
export function useWave(onToast: (message: string) => void) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { userId } = useAuth();
  const [waved, setWaved] = useState<Set<string>>(new Set());
  const [waving, setWaving] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    void fetchConnections(client, userId)
      .then((rows: ConnectionRow[]) => {
        const ids = rows
          .filter((row) => row.status === 'accepted' || (row.status === 'pending' && row.requester_id === userId))
          .map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id));
        setWaved(new Set(ids));
      })
      .catch(() => undefined);
  }, [client, userId]);

  const wave = useCallback(
    async (otherId: string) => {
      setWaving(otherId);
      try {
        await requestConnection(client, otherId, t('home.waveMessage'));
        hapticSuccess();
        setWaved((current) => new Set(current).add(otherId));
        onToast(t('friends.requestSentToast'));
      } catch (e) {
        hapticError();
        if (e instanceof ConnectionRequestError && e.code === 'ALREADY_FRIENDS') {
          setWaved((current) => new Set(current).add(otherId));
          onToast(t('friends.alreadyFriends'));
        } else {
          onToast(e instanceof ConnectionRequestError && e.code === 'BLOCKED' ? t('friends.requestBlocked') : t('onboarding.genericError'));
        }
      } finally {
        setWaving(null);
      }
    },
    [client, onToast, t],
  );

  return { waved, waving, wave };
}
