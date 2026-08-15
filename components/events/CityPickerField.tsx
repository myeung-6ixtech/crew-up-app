import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/icons';
import {
  formatEventCityLabel,
  findEventCity,
  searchEventCities,
} from '@/constants/airports';
import { BodyText, BottomSheet, Input } from '@/components/ui';
import type { EventCity } from '@/types/airport';
import { useThemedStyles, useTheme } from '@/theme';

type CityPickerFieldProps = {
  label: string;
  value: string;
  onChange: (city: string) => void;
  error?: string;
};

export function CityPickerField({ label, value, onChange, error }: CityPickerFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => findEventCity(value), [value]);
  const filtered = useMemo(() => searchEventCities(query), [query]);

  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 6 },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.input,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      backgroundColor: t.colors.bgSurface,
      minHeight: 48,
      gap: t.spacing.sm,
    },
    fieldFocused: { borderColor: t.colors.textPrimary },
    fieldError: { borderColor: t.colors.statusOnDuty },
    fieldText: {
      ...t.typography.body,
      color: t.colors.textPrimary,
      flex: 1,
    },
    placeholder: {
      color: t.colors.textTertiary,
    },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
    list: { flex: 1, marginTop: t.spacing.sm },
    row: {
      paddingVertical: t.spacing.sm + 2,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.input,
      marginBottom: t.spacing.xs,
    },
    rowSelected: {
      backgroundColor: t.colors.accentSubtle,
    },
    rowTitle: {
      ...t.typography.bodyStrong,
      color: t.colors.textPrimary,
    },
    rowTitleSelected: {
      color: t.colors.accent,
    },
    rowMeta: {
      marginTop: 2,
    },
    empty: {
      paddingVertical: t.spacing.xl,
      alignItems: 'center',
    },
  }));

  const closeSheet = () => {
    setSheetOpen(false);
    setQuery('');
  };

  const selectCity = (entry: EventCity) => {
    onChange(entry.city);
    closeSheet();
  };

  const displayText = selected
    ? formatEventCityLabel(selected)
    : value.trim() || t('events.selectCity');

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={t('events.selectCity')}
          onPress={() => setSheetOpen(true)}
          style={({ pressed }) => [
            styles.field,
            sheetOpen ? styles.fieldFocused : null,
            error ? styles.fieldError : null,
            { opacity: pressed ? 0.72 : 1 },
          ]}>
          <Text style={[styles.fieldText, !selected && !value.trim() ? styles.placeholder : null]}>
            {displayText}
          </Text>
          <AppIcon name="chevronDown" size={20} color={theme.colors.textTertiary} />
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={closeSheet}
        title={label}
        scrollable={false}
        heightRatio={0.9}>
        <Input
          label={t('airport.searchLabel')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('events.citySearchPlaceholder')}
          autoCapitalize="words"
        />

        <FlatList
          style={styles.list}
          data={filtered}
          keyExtractor={(item) => `${item.city}|${item.country}`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          ListEmptyComponent={
            <View style={styles.empty}>
              <BodyText muted style={{ textAlign: 'center' }}>
                {t('airport.noResults')}
              </BodyText>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selected?.city === item.city && selected?.country === item.country;
            return (
              <Pressable
                onPress={() => selectCity(item)}
                style={({ pressed }) => [
                  styles.row,
                  isSelected ? styles.rowSelected : null,
                  { opacity: pressed ? 0.82 : 1 },
                ]}>
                <Text style={[styles.rowTitle, isSelected ? styles.rowTitleSelected : null]}>
                  {item.city}
                </Text>
                <BodyText muted numberOfLines={1} style={styles.rowMeta}>
                  {item.country}
                </BodyText>
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </>
  );
}
