import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimeTile, formatShortDateTime } from '@/components/roster/DateTimeTile';
import { FlowFooter, FlowTitle, FlowTopBar, WarnChip } from '@/components/roster/flowKit';
import { Screen } from '@/components/ui';
import { AIRPORTS } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { MonoLabel, TextAction } from '@/features/onboarding/components/kit';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { insertRosters, mapParsedToRosterInsert } from '@/services/rosterService';
import { createTripsFromRosterLayovers } from '@/services/tripService';
import { useRosterDraftStore } from '@/stores/rosterDraftStore';
import { fontFamily, useTheme } from '@/theme';
import type { ParsedRosterEntry } from '@/types/domain';

function cityCode(city?: string | null) {
  const needle = city?.trim().toLowerCase();
  if (!needle) return null;
  if (/^[a-z]{3}$/.test(needle)) return AIRPORTS.find((airport) => airport.iata.toLowerCase() === needle)?.iata ?? null;
  return AIRPORTS.find((airport) => airport.city.toLowerCase() === needle)?.iata ?? null;
}

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

/** Confirm layovers: correct what the roster found, or add layovers by hand. Nothing is saved before Save. */
export default function RosterConfirmScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { entries, sourceFileId, updateEntry, removeEntry, addEntry, clear } = useRosterDraftStore();
  const fromFile = Boolean(sourceFileId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStart, setNewStart] = useState<Date | null>(null);
  const [newEnd, setNewEnd] = useState<Date | null>(null);

  const month = useMemo(() => {
    const first = entries.map((entry) => parseIso(entry.layoverStart)).find(Boolean);
    return first ? first.toLocaleDateString(undefined, { month: 'long' }) : null;
  }, [entries]);

  const draftReady = Boolean(newCity.trim() && newStart);
  const count = entries.length + (draftReady ? 1 : 0);

  const addDraft = () => {
    if (!draftReady || !newStart) return;
    const end = newEnd && newEnd.getTime() > newStart.getTime() ? newEnd : newStart;
    hapticImpact();
    addEntry({ layoverCity: newCity.trim(), layoverStart: newStart.toISOString(), layoverEnd: end.toISOString() });
    setNewCity('');
    setNewStart(null);
    setNewEnd(null);
  };

  const onSave = async () => {
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
              ? month
                ? t('rosterFlow.foundIn', { count: entries.length, month })
                : t('rosterFlow.found', { count: entries.length })
              : t('rosterFlow.manualIntro')}
          </Text>

          <View style={{ gap: 10, marginTop: 18 }}>
            {fromFile
              ? entries.map((entry, index) => {
                  const code = cityCode(entry.layoverCity);
                  const start = parseIso(entry.layoverStart);
                  const end = parseIso(entry.layoverEnd);
                  const missingCity = !entry.layoverCity?.trim();
                  return (
                    <View key={index} style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 16, gap: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{ fontFamily: fontFamily.jakartaBold, fontSize: 19, letterSpacing: -0.3, color: missingCity ? theme.colors.textTertiary : theme.colors.textPrimary, flexShrink: 1 }}>
                            {missingCity ? t('rosterFlow.cityTbd') : entry.layoverCity}
                          </Text>
                          {code ? (
                            <Text
                              style={{
                                fontFamily: fontFamily.monoMedium,
                                fontSize: 11,
                                color: theme.colors.onFill,
                                backgroundColor: theme.colors.fill,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 8,
                                overflow: 'hidden',
                              }}>
                              {code}
                            </Text>
                          ) : null}
                        </View>
                        {missingCity ? (
                          <WarnChip label={t('rosterFlow.checkCity')} />
                        ) : (
                          <TextAction label={t('rosterFlow.remove')} onPress={() => removeEntry(index)} style={{ fontSize: 13, color: theme.colors.textSecondary }} />
                        )}
                      </View>
                      <CityInput
                        label={t('rosterFlow.city')}
                        value={entry.layoverCity ?? ''}
                        onChangeText={(value) => updateEntry(index, { ...entry, layoverCity: value })}
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <DateTimeTile
                          style={{ flex: 1 }}
                          label={t('rosterFlow.start')}
                          value={start}
                          onChange={(value) => updateEntry(index, { ...entry, layoverStart: value.toISOString() })}
                        />
                        <DateTimeTile
                          style={{ flex: 1 }}
                          label={t('rosterFlow.end')}
                          value={end}
                          minimumDate={start ?? undefined}
                          invalid={Boolean(start && end && end.getTime() < start.getTime())}
                          onChange={(value) => updateEntry(index, { ...entry, layoverEnd: value.toISOString() })}
                        />
                      </View>
                      {missingCity ? (
                        <View style={{ alignItems: 'flex-end' }}>
                          <TextAction label={t('rosterFlow.remove')} onPress={() => removeEntry(index)} style={{ fontSize: 13, color: theme.colors.textSecondary }} />
                        </View>
                      ) : null}
                    </View>
                  );
                })
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
            label: count ? t('rosterFlow.saveCount', { count }) : t('common.save'),
            disabled: !count,
            loading: saving,
            onPress: () => void onSave(),
          }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
