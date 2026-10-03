import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeetWhereFields } from '@/components/events/MeetWhereFields';
import { WhenTiles } from '@/components/events/WhenTiles';
import { Screen, combineDateAndTime } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { FilledField, MonoLabel, PillCta, TextAction, TogglePill } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSelection, hapticSuccess } from '@/lib/haptics';
import { fetchActivities, fetchActivityPreferences } from '@/services/activityService';
import { fetchEvent, replaceEventActivities, updateEvent } from '@/services/eventService';
import { fontFamily, useTheme } from '@/theme';
import type { Activity } from '@/types/domain';

type EventDetail = {
  id: string;
  title: string;
  description?: string | null;
  city: string;
  starts_at: string;
  venue_name?: string | null;
  venue_address?: string | null;
  capacity?: number | null;
  creator_id: string;
  host_type?: string | null;
  cancelled_at?: string | null;
  attendees?: { status: string }[];
  eventActivities?: Array<{ activity?: { id?: string | null } | null }>;
};

/** Edit meet: prefilled, modal. The limit can't drop below who's going; time or place changes reach everyone going. */
export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId, profile } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Activity[]>([]);
  const [mineIds, setMineIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const next: EventDetail | null = await fetchEvent(client, id);
    // Only the host edits a member meet; platform meets and cancelled meets are read-only.
    if (!next || next.host_type === 'platform' || next.creator_id !== userId || next.cancelled_at) {
      router.replace(SCREENS.events.detail(id));
      return;
    }
    setEvent(next);
    setTitle(next.title);
    setDate(new Date(next.starts_at));
    setTime(new Date(next.starts_at));
    setCity(next.city ?? '');
    setVenue(next.venue_name ?? '');
    setAddress(next.venue_address ?? '');
    setNotes(next.description ?? '');
    setCapacity(next.capacity ?? 1);
    setSelectedIds(
      (next.eventActivities ?? []).flatMap((row) => (row.activity?.id ? [row.activity.id] : [])),
    );
  }, [client, id, router, userId]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchActivities(client), userId ? fetchActivityPreferences(client, userId) : Promise.resolve([])])
      .then(([list, preferences]) => {
        if (cancelled) return;
        setCatalog(list);
        setMineIds(preferences.filter((item) => item.kind === 'activity').map((item) => item.activityId));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [client, userId]);

  const { mine, others, interests } = useMemo(() => {
    const activities = catalog.filter((item) => (item.kind ?? 'activity') === 'activity');
    return {
      mine: activities.filter((item) => mineIds.includes(item.id)),
      others: activities.filter((item) => !mineIds.includes(item.id)),
      interests: catalog.filter((item) => item.kind === 'interest'),
    };
  }, [catalog, mineIds]);

  const toggle = (activityId: string) =>
    setSelectedIds((current) =>
      current.includes(activityId) ? current.filter((item) => item !== activityId) : [...current, activityId],
    );

  useEffect(() => {
    void load();
  }, [load]);

  const going = (event?.attendees ?? []).filter((attendee) => attendee.status === 'going').length;
  const minCapacity = Math.max(1, going);

  const onSave = async () => {
    if (!id || !event) return;
    const startsAt = date && time ? combineDateAndTime(date, time) : null;
    if (!title.trim()) {
      hapticError();
      setError(t('events.titleError'));
      return;
    }
    if (!city.trim()) {
      hapticError();
      setError(t('events.selectCityError'));
      return;
    }
    if (!startsAt || startsAt.getTime() < Date.now()) {
      hapticError();
      setError(t('events.selectDateTimeError'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateEvent(
        client,
        id,
        {
          title: title.trim(),
          city: city.trim(),
          starts_at: startsAt.toISOString(),
          venue_name: venue.trim() || null,
          venue_address: address.trim() || null,
          description: notes.trim(),
          capacity,
        },
        profile?.airline_id,
      );
      await replaceEventActivities(client, id, selectedIds);
      hapticSuccess();
      router.back();
    } catch {
      hapticError();
      setError(t('onboarding.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const step = (next: number) => {
    if (next < minCapacity || next > 999) return;
    hapticSelection();
    setCapacity(next);
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: insets.top + 46 }}>
        <View style={{ width: 60 }}>
          <TextAction label={t('common.cancel')} onPress={() => router.back()} />
        </View>
        <Text accessibilityRole="header" style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>
          {t('eventHost.editTitle')}
        </Text>
        <View style={{ width: 60 }} />
      </View>
      {!event ? (
        <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 80 }} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            {going ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#F6E7B8', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginTop: 16 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6B4E00', marginTop: 6 }} />
                <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 19, color: '#3A2C00' }}>
                  {t('eventHost.editBanner', { count: going })}
                </Text>
              </View>
            ) : null}
            <View style={{ marginTop: 16 }}>
              <FilledField label={t('events.meetTitle')} value={title} onChangeText={setTitle} placeholder={t('events.meetTitlePlaceholder')} />
              <View style={{ marginBottom: 10 }}>
                <WhenTiles date={date} time={time} minimumDate={new Date()} onDateChange={setDate} onTimeChange={setTime} />
              </View>
              <MeetWhereFields
                city={city}
                onCityChange={setCity}
                venue={venue}
                onVenueChange={setVenue}
                address={address}
                onAddressChange={setAddress}
              />
            </View>
            <MonoLabel style={{ fontSize: 10.5, marginTop: 8, marginBottom: 8 }}>{t('events.activitiesTitle')}</MonoLabel>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginBottom: 10 }}>
              {t('events.activitiesHint')}
            </Text>
            {mine.length ? (
              <>
                <MonoLabel style={{ fontSize: 10.5, marginBottom: 8 }}>{t('events.yourActivities')}</MonoLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {mine.map((item) => (
                    <TogglePill
                      key={item.id}
                      size="sm"
                      label={item.name}
                      selected={selectedIds.includes(item.id)}
                      onPress={() => toggle(item.id)}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <MonoLabel style={{ fontSize: 10.5, marginBottom: 8 }}>{t('events.allActivities')}</MonoLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {others.map((item) => (
                <TogglePill
                  key={item.id}
                  size="sm"
                  label={item.name}
                  selected={selectedIds.includes(item.id)}
                  onPress={() => toggle(item.id)}
                />
              ))}
            </View>
            <MonoLabel style={{ fontSize: 10.5, marginTop: 18, marginBottom: 8 }}>{t('events.interestsTitle')}</MonoLabel>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginBottom: 10 }}>
              {t('events.interestsHint')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {interests.map((item) => (
                <TogglePill
                  key={item.id}
                  size="sm"
                  label={item.name}
                  selected={selectedIds.includes(item.id)}
                  onPress={() => toggle(item.id)}
                />
              ))}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.colors.card,
                borderRadius: 16,
                paddingVertical: 12,
                paddingHorizontal: 14,
              }}>
              <View style={{ gap: 2, flex: 1 }}>
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{t('eventHost.limit')}</Text>
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>{t('eventHost.limitHint', { count: going })}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }} accessibilityLabel={t('eventHost.limit')} accessibilityValue={{ now: capacity }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('eventHost.limit')} −1`}
                  disabled={capacity <= minCapacity}
                  onPress={() => step(capacity - 1)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center', opacity: capacity <= minCapacity ? 0.4 : 1 }}>
                  <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, lineHeight: 22, color: theme.colors.textPrimary }}>−</Text>
                </Pressable>
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, minWidth: 24, textAlign: 'center', color: theme.colors.textPrimary }}>{capacity}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('eventHost.limit')} +1`}
                  onPress={() => step(capacity + 1)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, lineHeight: 22, color: theme.colors.onFill }}>+</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ marginTop: 10 }}>
              <FilledField label={t('events.notes')} value={notes} onChangeText={setNotes} placeholder={t('events.notesPlaceholder')} multiline />
            </View>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 4 }}>{t('eventHost.visibilityLocked')}</Text>
            {error ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, marginTop: 12 }}>{error}</Text> : null}
          </ScrollView>
          <View
            style={{
              paddingTop: 12,
              paddingHorizontal: 24,
              paddingBottom: Math.max(insets.bottom, 14),
              borderTopWidth: 1,
              borderTopColor: theme.colors.hairline,
              backgroundColor: theme.colors.bgCanvas,
            }}>
            <PillCta label={t('eventHost.saveChanges')} onPress={() => void onSave()} loading={saving} />
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}
