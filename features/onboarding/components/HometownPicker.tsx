import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SectionList, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { countryName } from '@crewup/shared';
import { BottomSheet } from '@/components/ui';
import { hapticImpact, hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme, useThemedStyles } from '@/theme';
import { FEATURED_CITIES, searchHometowns, type PlaceHit } from '../services/placeSearch';
import { CheckBadge, MonoLabel, MonoTag, PillCta, SearchGlyph, TextAction } from './kit';

export type HometownValue = {
  name: string;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
};

type HometownPickerProps = {
  /** Sheet title and accessibility label, e.g. "Where do you live?". */
  label: string;
  /** Helper line under the sheet title. */
  hint?: string;
  value: HometownValue | null;
  onChange: (value: HometownValue | null) => void;
  error?: string;
  /** Hometown can be cleared. Where you live cannot. */
  allowClear?: boolean;
};

function sameCity(hit: PlaceHit, value: HometownValue | null) {
  return Boolean(value) && hit.name === value?.name && hit.countryCode === value?.countryCode;
}

/** Search-pill trigger that opens a near full-height city sheet. Pick a result, then confirm. */
export function HometownPicker({ label, hint, value, onChange, error, allowClear = true }: HometownPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceHit[]>([]);
  const [pending, setPending] = useState<PlaceHit | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const styles = useThemedStyles((th) => ({
    trigger: {
      height: 52,
      borderRadius: 26,
      backgroundColor: th.colors.field,
      borderWidth: 2,
      borderColor: th.colors.field,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 16,
      paddingRight: 8,
    },
    triggerText: { flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15, color: th.colors.textPrimary },
    placeholder: { color: th.colors.textTertiary },
    error: { fontFamily: fontFamily.interRegular, fontSize: 12, color: th.colors.statusOnDuty, marginTop: 6, paddingLeft: 4 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 },
    headerTitle: { flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 16, color: th.colors.textPrimary },
    headerSide: { width: 56 },
    hint: {
      fontFamily: fontFamily.interRegular,
      fontSize: 12.5,
      color: th.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 16,
      marginTop: 4,
    },
    search: {
      height: 50,
      borderRadius: 25,
      backgroundColor: th.colors.field,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 18,
      paddingRight: 14,
      marginTop: 16,
    },
    searchInput: { flex: 1, fontFamily: fontFamily.interMedium, fontSize: 16, color: th.colors.textPrimary, padding: 0 },
    clear: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: th.colors.textTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingTop: 16,
      paddingBottom: 4,
      backgroundColor: th.colors.card,
    },
    sectionTitle: { fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 1, color: th.colors.textPrimary },
    sectionHint: { fontFamily: fontFamily.interRegular, fontSize: 11.5, color: th.colors.textTertiary },
    footer: {
      fontFamily: fontFamily.interRegular,
      fontSize: 12,
      color: th.colors.textTertiary,
      textAlign: 'center',
      paddingTop: 14,
      paddingBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 14,
    },
    code: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: th.colors.field,
      alignItems: 'center',
      justifyContent: 'center',
    },
    codeText: { fontFamily: fontFamily.monoMedium, fontSize: 11, color: th.colors.textPrimary },
    city: { fontFamily: fontFamily.interRegular, fontSize: 15.5, color: th.colors.textSecondary },
    cityMatch: { fontFamily: fontFamily.interMedium, color: th.colors.textPrimary },
    country: { fontFamily: fontFamily.interRegular, fontSize: 12.5, color: th.colors.textTertiary },
    empty: { fontFamily: fontFamily.interRegular, fontSize: 14, color: th.colors.textTertiary, textAlign: 'center', paddingVertical: 24 },
  }));

  useEffect(() => {
    if (!open) return undefined;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError('');
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError('');
      void searchHometowns(trimmed, controller.signal)
        .then((places) => {
          if (!controller.signal.aborted) setResults(places);
        })
        .catch((searchFailure: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setSearchError(searchFailure instanceof Error ? searchFailure.message : t('onboarding.about.hometownFailed'));
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, t]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setPending(null);
    setSearchError('');
  };

  const confirm = () => {
    if (!pending) return;
    onChange({
      name: pending.name,
      countryCode: pending.countryCode,
      latitude: pending.latitude,
      longitude: pending.longitude,
    });
    close();
  };

  const browsing = query.trim().length < 2;
  const sections = browsing
    ? FEATURED_CITIES.map((group) => ({
        key: group.key,
        title: t(`onboarding.residence.featured.${group.key}`),
        hint: t(`onboarding.residence.featured.${group.key}Hint`),
        data: group.cities,
      }))
    : results.length
      ? [{ key: 'results', title: t('onboarding.residence.results'), hint: '', data: results }]
      : [];

  const renderCity = (name: string) => {
    const typed = query.trim();
    if (typed && name.toLowerCase().startsWith(typed.toLowerCase())) {
      return (
        <Text style={styles.city} numberOfLines={1}>
          <Text style={styles.cityMatch}>{name.slice(0, typed.length)}</Text>
          {name.slice(typed.length)}
        </Text>
      );
    }
    return (
      <Text style={[styles.city, styles.cityMatch]} numberOfLines={1}>
        {name}
      </Text>
    );
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value?.name }}
        onPress={() => {
          hapticImpact();
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.trigger,
          error ? { borderColor: theme.colors.statusOnDuty } : null,
          { opacity: pressed ? 0.8 : 1 },
        ]}>
        <SearchGlyph />
        <Text style={[styles.triggerText, value?.name ? null : styles.placeholder]} numberOfLines={1}>
          {value?.name || t('onboarding.about.hometownPlaceholder')}
        </Text>
        {value?.countryCode ? <MonoTag label={value.countryCode} tone="chip" /> : null}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <BottomSheet visible={open} onClose={close} scrollable={false} heightRatio={0.92}>
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TextAction label={t('common.cancel')} onPress={close} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {label}
          </Text>
          <View style={styles.headerSide} />
        </View>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        <View style={styles.search}>
          <SearchGlyph color={theme.colors.textPrimary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            placeholder={t('onboarding.residence.searchPlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            selectionColor={theme.colors.accentText}
            accessibilityLabel={t('onboarding.about.hometownSearch')}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.clear')} onPress={() => setQuery('')} hitSlop={8} style={styles.clear}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 14, fontFamily: fontFamily.interMedium }}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        {allowClear && value?.name ? (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <TextAction
              label={t('onboarding.about.hometownClear')}
              onPress={() => {
                onChange(null);
                close();
              }}
            />
          </View>
        ) : null}
        {searching && !results.length ? (
          <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: theme.spacing.lg }} />
        ) : null}
        <SectionList
          style={{ flex: 1 }}
          sections={sections}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <MonoLabel style={styles.sectionTitle}>{section.title}</MonoLabel>
              {section.hint ? <Text style={styles.sectionHint}>{section.hint}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            searching ? null : (
              <Text style={styles.empty}>{searchError || t('onboarding.about.hometownEmpty')}</Text>
            )
          }
          ListFooterComponent={browsing ? <Text style={styles.footer}>{t('onboarding.residence.searchMore')}</Text> : null}
          renderItem={({ item }) => {
            const selected = pending ? pending.id === item.id : sameCity(item, value);
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${item.name}, ${countryName(item.countryCode) ?? item.detail}`}
                onPress={() => {
                  hapticSelection();
                  setPending(pending?.id === item.id ? null : item);
                }}
                style={({ pressed }) => [
                  styles.row,
                  browsing ? { paddingVertical: 9 } : null,
                  { backgroundColor: selected || pressed ? theme.colors.field : 'transparent' },
                ]}>
                <View style={styles.code}>
                  <Text style={styles.codeText}>{item.countryCode}</Text>
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  {renderCity(item.name)}
                  {item.detail ? (
                    <Text style={styles.country} numberOfLines={1}>
                      {item.detail}
                    </Text>
                  ) : null}
                </View>
                {selected ? <CheckBadge size={24} /> : null}
              </Pressable>
            );
          }}
        />
        <View style={{ paddingTop: theme.spacing.md }}>
          <PillCta
            label={pending ? t('onboarding.residence.confirmCity', { city: pending.name }) : t('onboarding.residence.pickCity')}
            disabled={!pending}
            onPress={confirm}
          />
        </View>
      </BottomSheet>
    </>
  );
}
