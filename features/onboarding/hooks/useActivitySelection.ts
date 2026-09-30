import { useEffect, useState } from 'react';
import { useApolloClient } from '@/lib/apolloHooks';
import {
  fetchActivities,
  fetchActivityPreferences,
  replaceActivityPreferences,
} from '@/services/activityService';
import type { Activity } from '@/types/domain';

/** Loads the catalog and the member's current tags. Selection stays in memory across phase changes. */
export function useActivitySelection(userId?: string | null) {
  const client = useApolloClient();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    void Promise.all([fetchActivities(client), fetchActivityPreferences(client, userId)])
      .then(([list, preferences]) => {
        if (cancelled) return;
        setFailed(false);
        setActivities(list);
        setSelectedIds(preferences.map((item) => item.activityId));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, userId]);

  const toggle = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const save = async () => {
    if (!userId || failed) return;
    setSaving(true);
    try {
      await replaceActivityPreferences(client, userId, selectedIds);
    } finally {
      setSaving(false);
    }
  };

  return { activities, selectedIds, toggle, save, loading, failed, saving };
}
