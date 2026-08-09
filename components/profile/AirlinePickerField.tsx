import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/icons';
import {
  BodyText,
  BottomSheet,
  Input,
  SelectionOption,
} from '@/components/ui';
import { useThemedStyles, useTheme } from '@/theme';

export type AirlineOption = {
  id: string;
  name: string;
  code: string;
};

type AirlinePickerFieldProps = {
  label: string;
  airlines: AirlineOption[];
  value?: string;
  onChange: (airlineId: string | undefined) => void;
  loading?: boolean;
  error?: string;
  /** When true, user can clear the selection. */
  optional?: boolean;
};

function formatAirlineLabel(airline: AirlineOption) {
  return `${airline.name} (${airline.code})`;
}

export function AirlinePickerField({
  label,
  airlines,
  value,
  onChange,
  loading = false,
  error,
  optional = false,
}: AirlinePickerFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => airlines.find((airline) => airline.id === value),
    [airlines, value],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return airlines;
    return airlines.filter(
      (airline) =>
        airline.name.toLowerCase().includes(normalized) ||
        airline.code.toLowerCase().includes(normalized),
    );
  }, [airlines, query]);

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
    fieldError: { borderColor: t.colors.statusOnDuty },
    fieldDisabled: { opacity: 0.6 },
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
    empty: { paddingVertical: t.spacing.lg },
  }));

  const closeSheet = () => {
    setSheetOpen(false);
    setQuery('');
  };

  const openSheet = () => {
    if (loading) return;
    setSheetOpen(true);
  };

  const selectAirline = (airlineId: string | undefined) => {
    onChange(airlineId);
    closeSheet();
  };

  const displayText = loading
    ? t('airline.loading')
    : selected
      ? formatAirlineLabel(selected)
      : t('airline.select');

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={t('airline.select')}
          onPress={openSheet}
          disabled={loading}
          style={({ pressed }) => [
            styles.field,
            error ? styles.fieldError : null,
            loading ? styles.fieldDisabled : null,
            { opacity: pressed && !loading ? 0.72 : 1 },
          ]}>
          <Text style={[styles.fieldText, !selected && !loading ? styles.placeholder : null]}>
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
        scrollable={false}>
        <Input
          label={t('airline.searchLabel')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('airline.searchPlaceholder')}
        />

        <FlatList
          style={styles.list}
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          ListHeaderComponent={
            optional ? (
              <SelectionOption
                label={t('airline.clear')}
                selected={!value}
                onPress={() => selectAirline(undefined)}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <BodyText muted style={{ textAlign: 'center' }}>
                {t('airline.noResults')}
              </BodyText>
            </View>
          }
          renderItem={({ item }) => (
            <SelectionOption
              label={formatAirlineLabel(item)}
              selected={value === item.id}
              onPress={() => selectAirline(item.id)}
            />
          )}
        />
      </BottomSheet>
    </>
  );
}
