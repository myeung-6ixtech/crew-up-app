import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AirlineLogo, AirlineLogoInline } from '@/components/profile/AirlineLogo';
import {
  PickerFieldShell,
  usePickerFieldStyles,
} from '@/components/profile/pickerFieldShared';
import { BodyText, BottomSheet, SearchInputField } from '@/components/ui';

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const styles = usePickerFieldStyles();

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

  const closeSheet = () => {
    setSheetOpen(false);
    setQuery('');
  };

  const selectAirline = (airlineId: string | undefined) => {
    onChange(airlineId);
    closeSheet();
  };

  const title = loading
    ? t('airline.loading')
    : selected
      ? selected.name
      : t('airline.select');

  return (
    <>
      <PickerFieldShell
        label={label}
        error={error}
        disabled={loading}
        onPress={() => {
          if (!loading) setSheetOpen(true);
        }}
        accessibilityHint={t('airline.select')}
        placeholder={!selected && !loading}
        title={title}
        subtitle={selected ? selected.code : null}
        leading={
          selected ? (
            <AirlineLogo code={selected.code} />
          ) : (
            <AirlineLogo code="" muted />
          )
        }
      />

      <BottomSheet visible={sheetOpen} onClose={closeSheet} title={label} scrollable={false}>
        <SearchInputField
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
              <Pressable
                onPress={() => selectAirline(undefined)}
                style={({ pressed }) => [
                  styles.listRow,
                  !value ? styles.listRowSelected : null,
                  { opacity: pressed ? 0.82 : 1 },
                ]}>
                <AirlineLogoInline code="" />
                <View style={styles.listContent}>
                  <Text style={styles.title}>{t('airline.clear')}</Text>
                </View>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <BodyText muted style={{ textAlign: 'center' }}>
                {t('airline.noResults')}
              </BodyText>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = value === item.id;
            return (
              <Pressable
                onPress={() => selectAirline(item.id)}
                style={({ pressed }) => [
                  styles.listRow,
                  isSelected ? styles.listRowSelected : null,
                  { opacity: pressed ? 0.82 : 1 },
                ]}>
                <AirlineLogoInline code={item.code} />
                <View style={styles.listContent}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.subtitle}>{item.code}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </>
  );
}
