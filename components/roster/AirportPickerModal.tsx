import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { searchAirports } from '@/constants/airports';
import { BottomSheet } from '@/components/ui';
import { CheckBadge, MonoLabel, SearchGlyph, TextAction } from '@/features/onboarding/components/kit';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, motion, useTheme } from '@/theme';
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

/** Near full-height sheet: search by city, airport or IATA code. Same sheet as onboarding Places. */
export function AirportPickerModal({ visible, title, selectedIata, excludeIata, preferIata, onClose, onSelect }: AirportPickerModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      inputRef.current?.blur();
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), motion.base);
    return () => clearTimeout(timer);
  }, [visible]);
  const filtered = useMemo(() => searchAirports(query, { excludeIata, preferIata }), [query, excludeIata, preferIata]);

  const close = () => {
    setQuery('');
    onClose();
  };

  const pick = (airport: Airport) => {
    hapticSelection();
    setQuery('');
    onSelect(airport);
  };

  return (
    <BottomSheet visible={visible} onClose={close} scrollable={false} heightRatio={0.92}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
        <View style={{ width: 56 }}>
          <TextAction label={t('common.cancel')} onPress={close} />
        </View>
        <Text accessibilityRole="header" numberOfLines={1} style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary }}>
          {title}
        </Text>
        <View style={{ width: 56 }} />
      </View>
      <View
        style={{
          height: 50,
          borderRadius: 25,
          backgroundColor: theme.colors.field,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 18,
          marginTop: 16,
        }}>
        <SearchGlyph color={theme.colors.textPrimary} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="characters"
          placeholder={t('airport.searchPlaceholder')}
          placeholderTextColor={theme.colors.textTertiary}
          selectionColor={theme.colors.accentText}
          accessibilityLabel={t('airport.searchLabel')}
          clearButtonMode="while-editing"
          style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 16, color: theme.colors.textPrimary, padding: 0 }}
        />
      </View>
      {filtered.length ? <MonoLabel style={{ fontSize: 10.5, color: theme.colors.textTertiary, paddingTop: 20, paddingBottom: 6, paddingHorizontal: 8 }}>{t('airport.airports')}</MonoLabel> : null}
      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(item) => item.iata}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center', paddingVertical: 24 }}>
            {t('airport.noResults')}
          </Text>
        }
        ListFooterComponent={
          !query.trim() ? (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary, textAlign: 'center', paddingTop: 18, paddingBottom: 8 }}>
              {t('airport.searchPlaceholder')}
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const selected = selectedIata === item.iata;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.iata}, ${item.name}, ${item.city}`}
              onPress={() => pick(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderRadius: 14,
                backgroundColor: selected || pressed ? theme.colors.field : 'transparent',
              })}>
              <View style={{ width: 48, height: 40, borderRadius: 12, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.textPrimary }}>{item.iata}</Text>
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 15.5, color: theme.colors.textPrimary }}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
                  {`${item.city}, ${item.country}`}
                </Text>
              </View>
              {selected ? <CheckBadge size={24} /> : null}
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}
