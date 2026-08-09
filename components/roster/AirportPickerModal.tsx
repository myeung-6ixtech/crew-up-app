import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { searchAirports } from '@/constants/airports';
import { BodyText, BottomSheet, Input, NumericText } from '@/components/ui';
import type { Airport } from '@/types/airport';
import { useThemedStyles } from '@/theme';

type AirportPickerModalProps = {
  visible: boolean;
  title: string;
  selectedIata?: string;
  excludeIata?: string;
  preferIata?: string;
  onClose: () => void;
  onSelect: (airport: Airport) => void;
};

export function AirportPickerModal({
  visible,
  title,
  selectedIata,
  excludeIata,
  preferIata,
  onClose,
  onSelect,
}: AirportPickerModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => searchAirports(query, { excludeIata, preferIata }),
    [query, excludeIata, preferIata],
  );

  const styles = useThemedStyles((t) => ({
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
    rowCode: {
      fontFamily: t.typography.bodyStrong.fontFamily,
    },
    rowCodeSelected: {
      color: t.colors.accent,
    },
    rowCodeDefault: {
      color: t.colors.textPrimary,
    },
    rowMeta: {
      marginTop: 2,
    },
    empty: {
      paddingVertical: t.spacing.xl,
      alignItems: 'center',
    },
  }));

  const close = () => {
    setQuery('');
    onClose();
  };

  const pick = (airport: Airport) => {
    setQuery('');
    onSelect(airport);
  };

  return (
    <BottomSheet visible={visible} onClose={close} title={title} scrollable={false} heightRatio={0.9}>
      <Input
        label={t('airport.searchLabel')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('airport.searchPlaceholder')}
        autoCapitalize="characters"
      />

      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={(item) => item.iata}
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
          const selected = selectedIata === item.iata;
          return (
            <Pressable
              onPress={() => pick(item)}
              style={({ pressed }) => [
                styles.row,
                selected ? styles.rowSelected : null,
                { opacity: pressed ? 0.82 : 1 },
              ]}>
              <NumericText
                style={[styles.rowCode, selected ? styles.rowCodeSelected : styles.rowCodeDefault]}>
                {item.iata}
              </NumericText>
              <BodyText muted numberOfLines={1} style={styles.rowMeta}>
                {item.name}
              </BodyText>
              <NumericText muted>
                {item.city}, {item.country}
              </NumericText>
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}
