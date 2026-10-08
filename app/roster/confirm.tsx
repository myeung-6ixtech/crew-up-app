import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimeTile, formatShortDateTime } from '@/components/roster/DateTimeTile';
import { FlowFooter, FlowTitle, FlowTopBar, WarnChip } from '@/components/roster/flowKit';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { MonoLabel, TextAction } from '@/features/onboarding/components/kit';
import { airportDayOffset, formatAirportDate, formatAirportTime } from '@/lib/airportTime';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSelection, hapticSuccess } from '@/lib/haptics';
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

const HAIRLINE = '#EEF0EA';

function dayMonth(iso: string, code: string | null | undefined) {
  return formatAirportDate(iso, code ?? null, { day: 'numeric', month: 'short' });
}

/** "3 Oct 12:50" in the airport's own clock; device time when the airport is unknown. */
function localWhen(iso: string | null | undefined, code: string | null | undefined) {
  const date = parseIso(iso);
  if (!date || !iso) return '';
  return code ? `${dayMonth(iso, code)} ${formatAirportTime(iso, code)}` : formatShortDateTime(date);
}

/** "3 – 4 OCT", or "30 SEP – 2 OCT" across a month. */
function tripDates(trip: ParsedRosterTrip) {
  const first = trip.legs[0];
  const last = trip.legs[trip.legs.length - 1];
  const startIso = first?.scheduledDeparture ?? trip.layovers[0]?.layoverStart;
  const endIso = last?.scheduledArrival ?? trip.layovers[trip.layovers.length - 1]?.layoverEnd;
  if (!startIso) return '';
  const startCode = first?.departureAirport ?? trip.layovers[0]?.arrivalAirport;
  const endCode = last?.arrivalAirport ?? trip.layovers[trip.layovers.length - 1]?.arrivalAirport;
  const start = dayMonth(startIso, startCode);
  const end = endIso ? dayMonth(endIso, endCode) : start;
  if (start === end) return start.toUpperCase();
  const startMonth = formatAirportDate(startIso, startCode ?? null, { month: 'short' });
  const endMonth = endIso ? formatAirportDate(endIso, endCode ?? null, { month: 'short' }) : startMonth;
  const startLabel = startMonth === endMonth ? formatAirportDate(startIso, startCode ?? null, { day: 'numeric' }) : start;
  return `${startLabel} – ${end}`.toUpperCase();
}

function CountChip({ label, strong }: { label: string; strong?: boolean }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontFamily: fontFamily.monoMedium,
        fontSize: 11,
        color: strong ? '#A8E05F' : theme.colors.textPrimary,
        backgroundColor: strong ? '#0E1113' : theme.colors.field,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        overflow: 'hidden',
      }}>
      {label.toUpperCase()}
    </Text>
  );
}

function CheckBadge() {
  return (
    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#0E1113', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={10} height={8} viewBox="0 0 10 8">
        <Path d="M1 4l2.8 2.8L9 1.2" stroke="#A8E05F" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

/** One flight: number, both ends in local time, and the day it leaves. */
function LegRow({ leg }: { leg: ParsedRosterLeg }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const nextDay = airportDayOffset(leg.scheduledDeparture, leg.departureAirport, leg.scheduledArrival, leg.arrivalAirport) > 0;
  const strong = { fontFamily: fontFamily.interMedium, color: theme.colors.textPrimary };
  return (
    <View style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: HAIRLINE, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ width: 50, fontFamily: fontFamily.monoMedium, fontSize: 12, color: theme.colors.textPrimary }}>{leg.flightNumber ?? '—'}</Text>
        <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textPrimary }}>
          <Text style={strong}>{`${leg.departureAirport} ${formatAirportTime(leg.scheduledDeparture, leg.departureAirport)}`}</Text>
          {' → '}
          <Text style={strong}>{`${leg.arrivalAirport} ${formatAirportTime(leg.scheduledArrival, leg.arrivalAirport)}`}</Text>
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textSecondary }}>{dayMonth(leg.scheduledDeparture, leg.departureAirport)}</Text>
      </View>
      {leg.lowConfidence || nextDay || leg.deadhead ? (
        <View style={{ paddingLeft: 60, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {leg.lowConfidence ? <WarnChip label={t('rosterFlow.checkFlight')} /> : null}
          {nextDay ? <MonoLabel style={{ fontSize: 10, color: theme.colors.accentText }}>{t('rosterFlow.arrivesNextDay')}</MonoLabel> : null}
          {leg.deadhead ? <MonoLabel style={{ fontSize: 10, color: theme.colors.textSecondary }}>{t('rosterFlow.deadhead')}</MonoLabel> : null}
        </View>
      ) : null}
    </View>
  );
}

function LayoverEditor({ entry, onChange }: { entry: ParsedRosterEntry; onChange: (entry: ParsedRosterEntry) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const start = parseIso(entry.layoverStart);
  const end = parseIso(entry.layoverEnd);
  return (
    <View style={{ backgroundColor: theme.colors.field, borderRadius: 12, padding: 10, gap: 8, marginBottom: 4 }}>
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

/** The lime band between two legs. Tap it to fix the city or times; a missing city opens it in amber. */
function LayoverBand({ entry, onChange }: { entry: ParsedRosterEntry; onChange: (entry: ParsedRosterEntry) => void }) {
  const { t } = useTranslation();
  const missingCity = !entry.layoverCity?.trim();
  const [open, setOpen] = useState(missingCity);
  const when = [localWhen(entry.layoverStart, entry.arrivalAirport), localWhen(entry.layoverEnd, entry.arrivalAirport)].filter(Boolean).join(' – ');
  return (
    <View style={{ marginVertical: 2, gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityHint={t('rosterFlow.editLayover')}
        onPress={() => {
          hapticSelection();
          setOpen((value) => !value);
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: missingCity ? '#FBEFD0' : '#EEF7DF',
          borderRadius: 10,
          paddingVertical: 8,
          paddingHorizontal: 10,
          opacity: pressed ? 0.75 : 1,
        })}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: missingCity ? '#6B4E00' : '#4F6E19' }} />
        <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 17, color: missingCity ? '#3A2C00' : '#2F4210' }}>
          {[t('rosterFlow.layoverAt', { city: missingCity ? t('rosterFlow.cityTbd') : entry.layoverCity }), when].filter(Boolean).join(' · ')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 12, color: missingCity ? '#6B4E00' : '#4F6E19' }}>
          {open ? t('rosterFlow.done') : t('rosterFlow.edit')}
        </Text>
      </Pressable>
      {open ? <LayoverEditor entry={entry} onChange={onChange} /> : null}
    </View>
  );
}

/** The layover that follows a leg: it starts where and when that leg lands. */
function layoverAfter(trip: ParsedRosterTrip, leg: ParsedRosterLeg) {
  return trip.layovers.findIndex((layover) => layover.flightNumber === leg.flightNumber && layover.arrivalAirport === leg.arrivalAirport);
}

/** One pairing: dates and route, each flight, and its layovers in lime between the legs. */
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
  const placed = new Set<number>();
  const missingCity = trip.layovers.some((layover) => !layover.layoverCity?.trim());
  const unsure = trip.legs.some((leg) => leg.lowConfidence);

  return (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
        <View style={{ flexShrink: 1, gap: 2 }}>
          <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 0.6, color: theme.colors.textSecondary }}>{tripDates(trip)}</Text>
          <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>
            {rosterTripRoute(trip) || t('rosterFlow.cityTbd')}
          </Text>
        </View>
        {missingCity ? <WarnChip label={t('rosterFlow.checkCity')} /> : unsure ? <WarnChip label={t('rosterFlow.checkLeg')} /> : <CheckBadge />}
      </View>
      {trip.legs.map((leg) => {
        const layoverIndex = layoverAfter(trip, leg);
        if (layoverIndex >= 0) placed.add(layoverIndex);
        return (
          <View key={`${leg.flightNumber}-${leg.scheduledDeparture}`}>
            <LegRow leg={leg} />
            {layoverIndex >= 0 ? <LayoverBand entry={trip.layovers[layoverIndex]} onChange={(entry) => onLayoverChange(layoverIndex, entry)} /> : null}
          </View>
        );
      })}
      {trip.layovers.map((layover, index) =>
        placed.has(index) ? null : <LayoverBand key={`layover-${index}`} entry={layover} onChange={(entry) => onLayoverChange(index, entry)} />,
      )}
      <View style={{ borderTopWidth: 1, borderTopColor: HAIRLINE, marginTop: 4, alignItems: 'flex-end' }}>
        <TextAction label={t('rosterFlow.removeTrip')} onPress={onRemove} style={{ fontSize: 13, color: theme.colors.textSecondary, paddingVertical: 10 }} />
      </View>
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
  const { entries, trips, sourceFileId, skippedDuties, removeEntry, addEntry, updateTripLayover, removeTrip, clear } = useRosterDraftStore();
  const fromFile = Boolean(sourceFileId);
  const flightCount = trips.reduce((sum, trip) => sum + trip.legs.length, 0);
  const layoverCount = trips.reduce((sum, trip) => sum + trip.layovers.length, 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStart, setNewStart] = useState<Date | null>(null);
  const [newEnd, setNewEnd] = useState<Date | null>(null);

  const monthTitle = useMemo(() => {
    const first = trips
      .flatMap((trip) => [trip.legs[0]?.scheduledDeparture, trip.layovers[0]?.layoverStart])
      .map((value) => parseIso(value))
      .find(Boolean);
    return first ? first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null;
  }, [trips]);

  const allPast = useMemo(() => {
    const ends = trips.flatMap((trip) => [
      ...trip.legs.map((leg) => Date.parse(leg.scheduledArrival)),
      ...trip.layovers.map((layover) => Date.parse(layover.layoverEnd ?? layover.layoverStart ?? '')),
    ]).filter(Number.isFinite);
    return ends.length > 0 && Math.max(...ends) < Date.now();
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
      const { saved, failures } = await createTripsFromRoster(trips, sourceFileId);
      const savedLayovers = saved.flatMap((index) => trips[index].layovers);
      if (savedLayovers.length) {
        await insertRosters(client, mapParsedToRosterInsert(savedLayovers, sourceFileId)).catch(() => undefined);
      }
      if (failures.length) {
        // Saved trips leave the list, so tapping Save again only retries the ones that failed.
        [...saved].sort((a, b) => b - a).forEach((index) => removeTrip(index));
        hapticError();
        setError(
          t('rosterFlow.someTripsFailed', {
            saved: saved.length,
            count: failures.length,
            reason: failures.map((failure) => `${failure.route}: ${failure.message}`).join('\n'),
          }),
        );
        return;
      }
      hapticSuccess();
      clear();
      router.replace(SCREENS.tabs.home);
    } catch (e) {
      hapticError();
      setError(e instanceof Error && e.message ? `${t('addTrip.saveTripError')}\n${e.message}` : t('addTrip.saveTripError'));
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
        <FlowTopBar title={fromFile ? t('rosterFlow.reviewTrips') : t('roster.confirm')} backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 }}>
          <FlowTitle>{fromFile ? (monthTitle ?? t('rosterFlow.reviewTrips')) : t('roster.confirm')}</FlowTitle>
          {fromFile ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                <CountChip strong label={t('rosterFlow.flightsCount', { count: flightCount })} />
                <CountChip label={t('rosterFlow.tripsCount', { count: trips.length })} />
                <CountChip label={t('rosterFlow.layoversCount', { count: layoverCount })} />
              </View>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: theme.colors.textSecondary, marginTop: 10 }}>
                {t('rosterFlow.reviewHint')}
              </Text>
            </>
          ) : (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary, marginTop: 8 }}>
              {t('rosterFlow.manualIntro')}
            </Text>
          )}
          {fromFile && allPast ? (
            <View style={{ marginTop: 12, backgroundColor: '#FBEFD0', borderRadius: 14, padding: 12, gap: 6 }}>
              <WarnChip label={t('rosterFlow.pastTitle')} />
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 19, color: '#3A2C00' }}>{t('rosterFlow.pastBody')}</Text>
            </View>
          ) : null}

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

          {fromFile && skippedDuties > 0 ? (
            <View style={{ marginTop: 12, backgroundColor: theme.colors.field, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 19, color: theme.colors.textPrimary }}>
                <Text style={{ fontFamily: fontFamily.interMedium }}>{t('rosterFlow.notImported')}</Text>
                {` ${t('rosterFlow.skippedDuties', { count: skippedDuties })}`}
              </Text>
            </View>
          ) : null}

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
