import { useEffect, useState } from 'react';
import { countPicked, isSelectable, kindOf, type CatalogKind } from '@crewup/shared';
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
  /** What was saved when the screen opened ("Your activities" in the sheets). */
  const [savedIds, setSavedIds] = useState<string[]>([]);
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
        setSavedIds(preferences.map((item) => item.activityId));
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

  /** Picks of one kind, e.g. "Next · 3 picked" on each onboarding step. */
  const countOf = (kind: CatalogKind) => countPicked(activities, selectedIds, kind);

  const idsOfKind = (kind: CatalogKind) =>
    selectedIds.filter((id) => activities.some((item) => item.id === id && isSelectable(item) && kindOf(item) === kind));

  /** Saves `ids` (default: every pick). The service drops anything that isn't a child row. */
  const save = async (ids: string[] = selectedIds) => {
    if (!userId || failed) return;
    setSaving(true);
    try {
      await replaceActivityPreferences(client, userId, ids, activities);
    } finally {
      setSaving(false);
    }
  };

  return { activities, selectedIds, savedIds, setSelectedIds, toggle, save, countOf, idsOfKind, loading, failed, saving };
}
