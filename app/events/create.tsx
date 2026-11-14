import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { PushedTopBar } from '@/components/crew/kit';
import { ActivityPickerField } from '@/components/events/ActivityPickerField';
import { EventCoverField, uploadEventCover, type EventCoverPick } from '@/components/events/EventCoverField';
import { EventMeetTypeOverlay } from '@/components/events/EventMeetTypeOverlay';
import { MeetKindCard, PrivateHiddenNote } from '@/components/events/MeetKindCard';
import { EventTagsField } from '@/components/events/EventTagsField';
import { MeetWhereFields } from '@/components/events/MeetWhereFields';
import { WhenTiles } from '@/components/events/WhenTiles';
import { Screen, combineDateAndTime } from '@/components/ui';
import { EVENT_MEET_VISIBILITY, type EventMeetType, meetTypeFromVisibilityScope } from '@/constants/events';
import { SCREENS } from '@/constants/screens';
import { FilledField, PillCta } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { contentBlockedMessage } from '@/lib/contentErrors';
import { hapticError, hapticSelection } from '@/lib/haptics';
import { fetchActivities, fetchActivityPreferences } from '@/services/activityService';
import { useGuidelinesGate } from '@/features/legal/guidelinesGate';
import { createEventWithThread, insertEventActivities } from '@/services/eventService';
import { fontFamily, useTheme } from '@/theme';
import type { Activity } from '@/types/domain';

function SectionHead({ index, title, hint, aside }: { index: string; title: string; hint?: string; aside?: string }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.accentText }}>{index}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>
          {title}
        </Text>
        {aside ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>{aside}</Text> : null}
      </View>
      {hint ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </View>
  );
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
  const insets = useScreenInsets();
  const client = useApolloClient();
  const ensureGuidelines = useGuidelinesGate();
  const { userId, profile } = useAuth();
  const { visibility_scope: visibilityScopeParam } = useLocalSearchParams<{ visibility_scope?: string }>();
  const [kind, setKind] = useState<EventMeetType>(meetTypeFromVisibilityScope(visibilityScopeParam));
  const [kindSheet, setKindSheet] = useState(false);
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
  const [cover, setCover] = useState<EventCoverPick | null>(null);
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

  const { activities, interests } = useMemo(
    () => ({
      activities: catalog.filter((item) => (item.kind ?? 'activity') === 'activity'),
      interests: catalog.filter((item) => item.kind === 'interest'),
    }),
    [catalog],
  );

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
    if (!(await ensureGuidelines())) return;
    setSaving(true);
    setSaveError('');
    try {
      const featuredImageFileId = cover ? await uploadEventCover(cover) : null;
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
          ...(featuredImageFileId ? { featured_image_file_id: featuredImageFileId } : {}),
        },
        userId,
        profile?.airline_id,
      );
      if (event?.id) {
        await insertEventActivities(client, event.id, selectedIds);
        // A private meet opens on its PIN first, so the host can send it straight away.
        router.replace(kind === 'private' ? SCREENS.events.pinReady(event.id) : SCREENS.events.detail(event.id));
      }
    } catch (e) {
      hapticError();
      setSaveError(contentBlockedMessage(e, t) ?? t('onboarding.genericError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <EventMeetTypeOverlay
        visible={kindSheet}
        onClose={() => setKindSheet(false)}
        onSelect={(next) => {
          setKind(next);
          setKindSheet(false);
        }}
      />
      <View style={{ paddingTop: insets.top }}>
        <PushedTopBar title={t('events.create')} onBack={() => router.back()} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={Platform.OS === 'android' ? -insets.bottom : 0}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          <MeetKindCard kind={kind} onChange={() => setKindSheet(true)} />

          <SectionHead index="01" title={t('events.activitiesTitle')} hint={t('events.activitiesHint')} />
          <ActivityPickerField kind="activity" items={activities} mineIds={mineIds} selectedIds={selectedIds} onChange={setSelectedIds} />

          <SectionHead index="02" title={t('events.interestsTitle')} hint={t('events.interestsHint')} />
          <ActivityPickerField kind="interest" items={interests} selectedIds={selectedIds} onChange={setSelectedIds} />

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
            <MeetWhereFields
              city={city}
              cityError={cityError || undefined}
              onCityChange={(next) => {
                setCity(next);
                setCityError('');
              }}
              venue={venueName}
              onVenueChange={setVenueName}
              address={venueAddress}
              onAddressChange={setVenueAddress}
            />
          </View>
          {kind === 'private' ? <PrivateHiddenNote /> : null}

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
          <EventTagsField tags={tags} onChange={setTags} />

          <SectionHead index="07" title={t('events.coverTitle')} aside={t('events.optional')} />
          <View style={{ marginTop: 10 }}>
            <EventCoverField
              cover={cover}
              hint={t('events.coverHintCreate')}
              onChange={(next) => {
                setSaveError('');
                setCover(next);
              }}
              onClear={() => setCover(null)}
              onError={setSaveError}
            />
          </View>
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
          <PillCta label={kind === 'private' ? t('events.createPrivate') : t('events.createPublic')} onPress={() => void onSubmit()} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
