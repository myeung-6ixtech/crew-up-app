import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PushedTopBar } from '@/components/crew/kit';
import { CityPickerField } from '@/components/events/CityPickerField';
import { WhenTiles } from '@/components/events/WhenTiles';
import { PickerFieldVariantProvider } from '@/components/profile/pickerFieldShared';
import { Screen, combineDateAndTime } from '@/components/ui';
import { EVENT_MEET_VISIBILITY, type EventMeetType, meetTypeFromVisibilityScope } from '@/constants/events';
import { EVENT_TAGS, SCREENS } from '@/constants/screens';
import { FilledField, MonoLabel, PillCta, TogglePill } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSelection } from '@/lib/haptics';
import { fetchActivities, fetchActivityPreferences } from '@/services/activityService';
import { createEventWithThread, insertEventActivities } from '@/services/eventService';
import { fontFamily, useTheme } from '@/theme';
import type { Activity } from '@/types/domain';

function SectionHead({ index, title, hint }: { index: string; title: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.accentText }}>{index}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>
          {title}
        </Text>
      </View>
      {hint ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

function PillWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{children}</View>;
}

function Stepper({ value, onChange, label }: { value: number; onChange: (next: number) => void; label: string }) {
  const theme = useTheme();
  const button = (glyph: string, next: number, tone: 'field' | 'lime', a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={next < 1 || next > 999}
      onPress={() => {
        hapticSelection();
        onChange(next);
      }}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: tone === 'lime' ? theme.colors.fill : theme.colors.field,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: next < 1 ? 0.4 : pressed ? 0.7 : 1,
      })}>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, lineHeight: 22, color: theme.colors.onFill }}>{glyph}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }} accessibilityLabel={label} accessibilityValue={{ now: value }}>
      {button('−', value - 1, 'field', `${label} −1`)}
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, color: theme.colors.textPrimary, minWidth: 22, textAlign: 'center' }}>{value}</Text>
      {button('+', value + 1, 'lime', `${label} +1`)}
    </View>
  );
}

/** Create meetup: visibility toggle, then Activities, Interests, When, Where, Who, What, and Save. */
export default function CreateEventScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId, profile } = useAuth();
  const { visibility_scope: visibilityScopeParam } = useLocalSearchParams<{ visibility_scope?: string }>();
  const [kind, setKind] = useState<EventMeetType>(meetTypeFromVisibilityScope(visibilityScopeParam));
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [city, setCity] = useState('');
  const [cityError, setCityError] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [startsAtError, setStartsAtError] = useState('');
  const [capacity, setCapacity] = useState(8);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Activity[]>([]);
  const [mineIds, setMineIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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

  const toggle = (id: string) =>
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const pills = (items: Activity[]) =>
    items.map((item) => (
      <TogglePill key={item.id} size="sm" label={item.name} selected={selectedIds.includes(item.id)} onPress={() => toggle(item.id)} />
    ));

  const onSubmit = async () => {
    if (!userId) return;
    let invalid = false;
    const startsAt = startDate && startTime ? combineDateAndTime(startDate, startTime) : null;
    if (!startsAt || startsAt.getTime() < Date.now()) {
      setStartsAtError(t('events.selectDateTimeError'));
      invalid = true;
    }
    if (!city.trim()) {
      setCityError(t('events.selectCityError'));
      invalid = true;
    }
    if (!title.trim()) {
      setTitleError(t('events.titleError'));
      invalid = true;
    }
    if (invalid || !startsAt) {
      hapticError();
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const event = await createEventWithThread(
        client,
        {
          title: title.trim(),
          city: city.trim(),
          venue_name: venueName.trim() || null,
          venue_address: venueAddress.trim() || null,
          description: description.trim(),
          starts_at: startsAt.toISOString(),
          tags,
          languages: ['en'],
          visibility_scope: EVENT_MEET_VISIBILITY[kind],
          capacity,
        },
        userId,
        profile?.airline_id,
      );
      if (event?.id) {
        await insertEventActivities(client, event.id, selectedIds);
        router.replace(SCREENS.events.detail(event.id));
      }
    } catch {
      hapticError();
      setSaveError(t('onboarding.genericError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar title={t('events.create')} onBack={() => router.back()} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          <View
            accessibilityRole="tablist"
            style={{ flexDirection: 'row', gap: 6, marginTop: 18, backgroundColor: theme.colors.field, borderRadius: 22, padding: 4 }}>
            {(['public', 'private'] as EventMeetType[]).map((value) => {
              const selected = kind === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    hapticSelection();
                    setKind(value);
                  }}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: selected ? theme.colors.ink : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: selected ? theme.colors.ground : theme.colors.textPrimary }}>
                    {value === 'public' ? t('events.publicMeet') : t('events.privateMeet')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionHead index="01" title={t('events.activitiesTitle')} hint={t('events.activitiesHint')} />
          {mine.length ? (
            <>
              <MonoLabel style={{ fontSize: 10.5, marginTop: 10, marginBottom: 8 }}>{t('events.yourActivities')}</MonoLabel>
              <PillWrap>{pills(mine)}</PillWrap>
            </>
          ) : null}
          <MonoLabel style={{ fontSize: 10.5, marginTop: 14, marginBottom: 8 }}>{t('events.allActivities')}</MonoLabel>
          <PillWrap>{pills(others)}</PillWrap>

          <SectionHead index="02" title={t('events.interestsTitle')} hint={t('events.interestsHint')} />
          <View style={{ marginTop: 10 }}>
            <PillWrap>{pills(interests)}</PillWrap>
          </View>

          <SectionHead index="03" title={t('events.when')} />
          <View style={{ marginTop: 10 }}>
            <WhenTiles
              date={startDate}
              time={startTime}
              minimumDate={new Date()}
              error={startsAtError || undefined}
              onDateChange={(date) => {
                setStartDate(date);
                setStartsAtError('');
              }}
              onTimeChange={(time) => {
                setStartTime(time);
                setStartsAtError('');
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: fontFamily.interRegular,
              fontSize: 12,
              color: startsAtError ? theme.colors.statusOnDuty : theme.colors.textTertiary,
              marginTop: 8,
            }}>
            {t('events.selectDateTimeError')}
          </Text>

          <SectionHead index="04" title={t('events.where')} />
          <View style={{ marginTop: 10 }}>
            <PickerFieldVariantProvider value="filled">
              <CityPickerField
                label={t('events.city')}
                value={city}
                onChange={(next) => {
                  setCity(next);
                  setCityError('');
                }}
                error={cityError || undefined}
              />
            </PickerFieldVariantProvider>
            <FilledField label={t('events.venue')} value={venueName} onChangeText={setVenueName} placeholder={t('events.venuePlaceholder')} />
            <FilledField
              label={t('events.address')}
              value={venueAddress}
              onChangeText={setVenueAddress}
              placeholder={t('onboarding.optionalTag')}
            />
          </View>

          <SectionHead index="05" title={t('events.who')} />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.colors.card,
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginTop: 10,
            }}>
            <View style={{ gap: 2, flex: 1 }}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{t('events.attendees')}</Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>
                {kind === 'public' ? t('events.whoPublic') : t('events.whoPrivate')}
              </Text>
            </View>
            <Stepper value={capacity} onChange={setCapacity} label={t('events.attendees')} />
          </View>

          <SectionHead index="06" title={t('events.what')} />
          <View style={{ marginTop: 10 }}>
            <FilledField
              label={t('events.meetTitle')}
              value={title}
              onChangeText={(next) => {
                setTitle(next);
                setTitleError('');
              }}
              placeholder={t('events.meetTitlePlaceholder')}
              error={titleError || undefined}
            />
            <FilledField
              label={t('events.notes')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('events.notesPlaceholder')}
              multiline
            />
          </View>
          <MonoLabel style={{ fontSize: 10.5, marginTop: 14, marginBottom: 8 }}>{t('events.quickTags')}</MonoLabel>
          <PillWrap>
            {EVENT_TAGS.map((tag) => (
              <TogglePill
                key={tag}
                size="sm"
                label={t(`events.tag.${tag}`)}
                selected={tags.includes(tag)}
                onPress={() => setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))}
              />
            ))}
          </PillWrap>
          {saveError ? (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, marginTop: 16 }}>{saveError}</Text>
          ) : null}
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
          <PillCta label={t('common.save')} onPress={() => void onSubmit()} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
