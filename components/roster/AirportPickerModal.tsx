import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { searchAirports } from '@/constants/airports';
import { SelectionSquircle, usePickerFieldStyles } from '@/components/profile/pickerFieldShared';
import { BodyText, BottomSheet, SearchInputField } from '@/components/ui';
import type { Airport } from '@/types/airport';

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
  const styles = usePickerFieldStyles();

  const filtered = useMemo(
    () => searchAirports(query, { excludeIata, preferIata }),
    [query, excludeIata, preferIata],
  );

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
      <SearchInputField
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
                styles.listRow,
                selected ? styles.listRowSelected : null,
                { opacity: pressed ? 0.82 : 1 },
              ]}>
              <SelectionSquircle>
                <Text style={styles.squircleCode}>{item.iata}</Text>
              </SelectionSquircle>
              <View style={styles.listContent}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.city}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.name} · {item.country}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}
