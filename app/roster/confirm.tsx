import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimeTile, formatShortDateTime } from '@/components/roster/DateTimeTile';
import { FlowFooter, FlowTitle, FlowTopBar, WarnChip } from '@/components/roster/flowKit';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { MonoLabel, TextAction } from '@/features/onboarding/components/kit';
import { formatAirportDate, formatAirportTimeWithZone } from '@/lib/airportTime';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { insertRosters, mapParsedToRosterInsert } from '@/services/rosterService';
import { createTripsFromRoster, createTripsFromRosterLayovers, rosterTripRoute } from '@/services/tripService';
import { useRosterDraftStore } from '@/stores/rosterDraftStore';
import { fontFamily, useTheme } from '@/theme';
import type { ParsedRosterEntry, ParsedRosterLeg, ParsedRosterTrip } from '@/types/domain';

function parseIso(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function CityInput({ label, value, onChangeText, height = 50 }: { label: string; value: string; onChangeText: (value: string) => void; height?: number }) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        height,
        borderRadius: 12,
        backgroundColor: focused ? theme.colors.card : theme.colors.field,
        borderWidth: 2,
        borderColor: focused ? theme.colors.ink : theme.colors.field,
        paddingHorizontal: 12,
        justifyContent: 'center',
        gap: 1,
      }}>
      <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 10.5, color: theme.colors.textSecondary }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        autoCapitalize="words"
        autoCorrect={false}
        style={{ fontFamily: fontFamily.interMedium, fontSize: 14.5, color: theme.colors.textPrimary, padding: 0 }}
      />
    </View>
  );
}

function shortDay(iso: string, code: string | null) {
  return formatAirportDate(iso, code, { weekday: 'short', day: 'numeric', month: 'short' });
}

function LegRow({ leg }: { leg: ParsedRosterLeg }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text style={{ width: 62, fontFamily: fontFamily.monoMedium, fontSize: 12.5, color: theme.colors.textPrimary }}>{leg.flightNumber ?? '—'}</Text>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary }}>
          {`${leg.departureAirport} → ${leg.arrivalAirport}`}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textSecondary }}>
          {`${shortDay(leg.scheduledDeparture, leg.departureAirport)} · ${formatAirportTimeWithZone(leg.scheduledDeparture, leg.departureAirport)}`}
        </Text>
      </View>
      {leg.lowConfidence ? <WarnChip label={t('rosterFlow.checkLeg')} /> : null}
      {leg.deadhead ? (
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10, color: theme.colors.textSecondary }}>{t('rosterFlow.deadhead')}</Text>
      ) : null}
    </View>
  );
}

function LayoverEditor({ entry, onChange }: { entry: ParsedRosterEntry; onChange: (entry: ParsedRosterEntry) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const start = parseIso(entry.layoverStart);
  const end = parseIso(entry.layoverEnd);
  const missingCity = !entry.layoverCity?.trim();
  return (
    <View style={{ backgroundColor: theme.colors.field, borderRadius: 14, padding: 10, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <MonoLabel style={{ fontSize: 10 }}>{t('rosterFlow.layoverIn')}</MonoLabel>
        {missingCity ? <WarnChip label={t('rosterFlow.checkCity')} /> : null}
      </View>
      <CityInput label={t('rosterFlow.city')} value={entry.layoverCity ?? ''} onChangeText={(value) => onChange({ ...entry, layoverCity: value })} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <DateTimeTile style={{ flex: 1 }} label={t('rosterFlow.start')} value={start} onChange={(value) => onChange({ ...entry, layoverStart: value.toISOString() })} />
        <DateTimeTile
          style={{ flex: 1 }}
          label={t('rosterFlow.end')}
          value={end}
          minimumDate={start ?? undefined}
          invalid={Boolean(start && end && end.getTime() < start.getTime())}
          onChange={(value) => onChange({ ...entry, layoverEnd: value.toISOString() })}
        />
      </View>
    </View>
  );
}

/** The layover that follows a leg: it starts where and when that leg lands. */
function layoverAfter(trip: ParsedRosterTrip, leg: ParsedRosterLeg) {
  return trip.layovers.findIndex((layover) => layover.flightNumber === leg.flightNumber && layover.arrivalAirport === leg.arrivalAirport);
}

function TripReviewCard({
  trip,
  onLayoverChange,
  onRemove,
}: {
  trip: ParsedRosterTrip;
  onLayoverChange: (layoverIndex: number, entry: ParsedRosterEntry) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const first = trip.legs[0];
  const last = trip.legs[trip.legs.length - 1];
  const dates = first
    ? [shortDay(first.scheduledDeparture, first.departureAirport), last && last !== first ? shortDay(last.scheduledArrival, last.arrivalAirport) : null]
        .filter(Boolean)
        .join(' – ')
    : '';
  const placed = new Set<number>();

  return (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flexShrink: 1, gap: 2 }}>
          <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, letterSpacing: -0.3, color: theme.colors.textPrimary }}>
            {rosterTripRoute(trip) || t('rosterFlow.cityTbd')}
          </Text>
          {dates ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{dates}</Text> : null}
        </View>
        <TextAction label={t('rosterFlow.removeTrip')} onPress={onRemove} style={{ fontSize: 13, color: theme.colors.textSecondary }} />
      </View>
      {trip.legs.map((leg, legIndex) => {
        const layoverIndex = layoverAfter(trip, leg);
        if (layoverIndex >= 0) placed.add(layoverIndex);
        const isLast = legIndex === trip.legs.length - 1;
        return (
          <View key={`${leg.flightNumber}-${leg.scheduledDeparture}`} style={{ gap: 10 }}>
            <LegRow leg={leg} />
            {layoverIndex >= 0 ? (
              <LayoverEditor entry={trip.layovers[layoverIndex]} onChange={(entry) => onLayoverChange(layoverIndex, entry)} />
            ) : !isLast ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginLeft: 72 }}>{t('rosterFlow.noLayover')}</Text>
            ) : null}
          </View>
        );
      })}
      {trip.layovers.map((layover, index) =>
        placed.has(index) ? null : <LayoverEditor key={`layover-${index}`} entry={layover} onChange={(entry) => onLayoverChange(index, entry)} />,
      )}
    </View>
  );
}

/** Confirm a roster: review the trips it found, or add layovers by hand. Nothing is saved before Save. */
export default function RosterConfirmScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { entries, trips, sourceFileId, removeEntry, addEntry, updateTripLayover, removeTrip, clear } = useRosterDraftStore();
  const fromFile = Boolean(sourceFileId);
  const flightCount = trips.reduce((sum, trip) => sum + trip.legs.length, 0);
  const layoverCount = trips.reduce((sum, trip) => sum + trip.layovers.length, 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStart, setNewStart] = useState<Date | null>(null);
  const [newEnd, setNewEnd] = useState<Date | null>(null);

  const month = useMemo(() => {
    const first = trips
      .flatMap((trip) => [trip.legs[0]?.scheduledDeparture, trip.layovers[0]?.layoverStart])
      .map((value) => parseIso(value))
      .find(Boolean);
    return first ? first.toLocaleDateString(undefined, { month: 'long' }) : null;
  }, [trips]);

  const draftReady = Boolean(newCity.trim() && newStart);
  const count = fromFile ? trips.length : entries.length + (draftReady ? 1 : 0);

  const addDraft = () => {
    if (!draftReady || !newStart) return;
    const end = newEnd && newEnd.getTime() > newStart.getTime() ? newEnd : newStart;
    hapticImpact();
    addEntry({ layoverCity: newCity.trim(), layoverStart: newStart.toISOString(), layoverEnd: end.toISOString() });
    setNewCity('');
    setNewStart(null);
    setNewEnd(null);
  };

  const saveTrips = async () => {
    if (!trips.length) return;
    const layovers = trips.flatMap((trip) => trip.layovers);
    if (layovers.some((entry) => !entry.layoverCity?.trim())) {
      hapticError();
      setError(t('rosterFlow.cityMissing'));
      return;
    }
    if (layovers.some((entry) => (parseIso(entry.layoverEnd)?.getTime() ?? 0) < (parseIso(entry.layoverStart)?.getTime() ?? 0))) {
      hapticError();
      setError(t('rosterFlow.endBeforeStart'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createTripsFromRoster(trips, sourceFileId);
      if (layovers.length) await insertRosters(client, mapParsedToRosterInsert(layovers, sourceFileId));
      hapticSuccess();
      clear();
      router.replace(SCREENS.tabs.home);
    } catch {
      hapticError();
      setError(t('addTrip.saveTripError'));
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (fromFile) return saveTrips();
    const all: ParsedRosterEntry[] = [...entries];
    if (draftReady && newStart) {
      const end = newEnd && newEnd.getTime() > newStart.getTime() ? newEnd : newStart;
      all.push({ layoverCity: newCity.trim(), layoverStart: newStart.toISOString(), layoverEnd: end.toISOString() });
    }
    if (!all.length) return;
    if (all.some((entry) => !entry.layoverCity?.trim())) {
      hapticError();
      setError(t('rosterFlow.cityMissing'));
      return;
    }
    if (all.some((entry) => (parseIso(entry.layoverEnd)?.getTime() ?? 0) < (parseIso(entry.layoverStart)?.getTime() ?? 0))) {
      hapticError();
      setError(t('rosterFlow.endBeforeStart'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await insertRosters(client, mapParsedToRosterInsert(all, sourceFileId));
      await createTripsFromRosterLayovers(
        all.map((entry) => ({
          layoverCity: entry.layoverCity,
          layoverStart: entry.layoverStart,
          layoverEnd: entry.layoverEnd,
          flightNumber: entry.flightNumber,
          departureAirport: entry.departureAirport,
        })),
      );
      hapticSuccess();
      clear();
      router.replace(SCREENS.tabs.home);
    } catch {
      hapticError();
      setError(t('addTrip.saveTripError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <FlowTopBar title={t('roster.confirm')} backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 }}>
          <FlowTitle>{t('roster.confirm')}</FlowTitle>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary, marginTop: 8 }}>
            {fromFile
              ? t('rosterFlow.tripsIntro', {
                  trips: t('rosterFlow.tripsCount', { count: trips.length }),
                  flights: t('rosterFlow.flightsCount', { count: flightCount }),
                  layovers: t('rosterFlow.layoversCount', { count: layoverCount }),
                  month: month ? t('rosterFlow.inMonth', { month }) : '',
                })
              : t('rosterFlow.manualIntro')}
          </Text>

          <View style={{ gap: 10, marginTop: 18 }}>
            {fromFile
              ? trips.map((trip, tripIndex) => (
                  <TripReviewCard
                    key={`${tripIndex}-${trip.legs[0]?.scheduledDeparture ?? trip.layovers[0]?.layoverStart ?? ''}`}
                    trip={trip}
                    onLayoverChange={(layoverIndex, entry) => updateTripLayover(tripIndex, layoverIndex, entry)}
                    onRemove={() => removeTrip(tripIndex)}
                  />
                ))
              : entries.map((entry, index) => {
                  const start = parseIso(entry.layoverStart);
                  const end = parseIso(entry.layoverEnd);
                  return (
                    <View
                      key={index}
                      style={{ backgroundColor: theme.colors.card, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>{entry.layoverCity}</Text>
                        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>
                          {[start, end].filter((value): value is Date => Boolean(value)).map(formatShortDateTime).join(' – ')}
                        </Text>
                      </View>
                      <TextAction label={t('rosterFlow.remove')} onPress={() => removeEntry(index)} style={{ fontSize: 13, color: theme.colors.textSecondary }} />
                    </View>
                  );
                })}
          </View>

          {!fromFile ? (
            <View style={{ backgroundColor: theme.colors.card, borderWidth: 2, borderColor: theme.colors.ink, borderRadius: 20, padding: 16, marginTop: 12, gap: 10 }}>
              <MonoLabel style={{ fontSize: 10.5 }}>{t('rosterFlow.newEntry')}</MonoLabel>
              <CityInput label={t('rosterFlow.layoverCity')} value={newCity} onChangeText={setNewCity} height={52} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <DateTimeTile style={{ flex: 1 }} height={52} label={t('rosterFlow.start')} value={newStart} onChange={setNewStart} placeholder={t('rosterFlow.pick')} />
                <DateTimeTile
                  style={{ flex: 1 }}
                  height={52}
                  label={t('rosterFlow.end')}
                  value={newEnd}
                  minimumDate={newStart ?? undefined}
                  onChange={setNewEnd}
                  placeholder={t('rosterFlow.pick')}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !draftReady }}
                disabled={!draftReady}
                onPress={addDraft}
                style={({ pressed }) => ({
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#0E1113',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: !draftReady ? 0.4 : pressed ? 0.85 : 1,
                })}>
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: '#A8E05F' }}>{`+ ${t('rosterFlow.addEntry')}`}</Text>
              </Pressable>
            </View>
          ) : null}
          {error ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, marginTop: 12 }}>{error}</Text> : null}
        </ScrollView>
        <FlowFooter
          bottomInset={insets.bottom}
          primary={{
            label: count ? t(fromFile ? 'rosterFlow.saveTrips' : 'rosterFlow.saveCount', { count }) : t('common.save'),
            disabled: !count,
            loading: saving,
            onPress: () => void onSave(),
          }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
