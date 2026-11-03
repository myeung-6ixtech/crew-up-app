import { useCallback, useEffect, useState } from 'react';
import { useApolloClient, useSubscription } from '@/lib/apolloHooks';
import { useAuth } from '@/hooks/useSession';
import { fetchBlocks } from '@/services/connectionService';
import {
  DIRECT_MESSAGE_WAKE,
  fetchUnreadDirect,
  hasUnreadDirect,
  onDirectUnreadRefresh,
} from '@/services/messagingService';

/** True when a direct thread has a message from the other person newer than last_read_at. */
export function useDirectMessageBadge(): boolean {
  const client = useApolloClient();
  const { userId } = useAuth();
  const [unread, setUnread] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setUnread(false);
      return;
    }
    try {
      const [rows, blocks] = await Promise.all([
        fetchUnreadDirect(client, userId),
        fetchBlocks(client, userId).catch(() => []),
      ]);
      const blocked = new Set((blocks as { blocked_id: string }[]).map((block) => block.blocked_id));
      setUnread(hasUnreadDirect(rows, userId, blocked));
    } catch {
      setUnread(false);
    }
  }, [client, userId]);

  useEffect(() => {
    void load();
    return onDirectUnreadRefresh(() => {
      void load();
    });
  }, [load]);

  useSubscription(DIRECT_MESSAGE_WAKE, {
    variables: { userId: userId ?? '' },
    skip: !userId,
    onData: () => {
      void load();
    },
  });

  return unread;
}
