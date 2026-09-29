import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COUNTRIES, countryName } from '@crewup/shared';
import {
  PickerFieldShell,
  SelectionSquircle,
  usePickerFieldStyles,
} from '@/components/profile/pickerFieldShared';
import { BodyText, BottomSheet, SearchInputField } from '@/components/ui';

/** Regional-indicator flag emoji for an ISO 3166-1 alpha-2 code. */
export function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

type CountryPickerProps = {
  label: string;
  value?: string | null;
  onChange: (code: string) => void;
  error?: string;
  /** Shown under the country name in the list (e.g. dialling code). */
  describe?: (code: string) => string | null;
  /** Badge in the field and list. `code` shows the ISO letters, e.g. HK. */
  badge?: 'flag' | 'code';
};

export function CountryPicker({ label, value, onChange, error, describe, badge = 'flag' }: CountryPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const styles = usePickerFieldStyles();
  const selectedName = countryName(value);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COUNTRIES;
    return COUNTRIES.filter(
      ([code, name]) => name.toLowerCase().includes(normalized) || code.toLowerCase() === normalized,
    );
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const mark = (code: string) => (badge === 'code' ? code.toUpperCase() : flagEmoji(code));

  return (
    <>
      <PickerFieldShell
        label={label}
        error={error}
        onPress={() => setOpen(true)}
        accessibilityHint={t('onboarding.country.select')}
        placeholder={!selectedName}
        title={selectedName ?? t('onboarding.country.select')}
        subtitle={value && describe ? describe(value) : null}
        leading={
          <SelectionSquircle muted={!selectedName}>
            <Text style={selectedName ? styles.squircleCode : styles.squirclePlaceholder}>
              {value ? mark(value) : '—'}
            </Text>
          </SelectionSquircle>
        }
      />

      <BottomSheet visible={open} onClose={close} title={label} scrollable={false} heightRatio={0.9}>
        <SearchInputField
          label={t('onboarding.country.search')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.country.search')}
        />
        <FlatList
          style={styles.list}
          data={filtered}
          keyExtractor={([code]) => code}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <BodyText muted style={{ textAlign: 'center' }}>
                {t('onboarding.country.noResults')}
              </BodyText>
            </View>
          }
          renderItem={({ item: [code, name] }) => (
            <Pressable
              onPress={() => {
                onChange(code);
                close();
              }}
              style={({ pressed }) => [
                styles.listRow,
                value === code ? styles.listRowSelected : null,
                { opacity: pressed ? 0.82 : 1 },
              ]}>
              <SelectionSquircle>
                <Text style={styles.squircleCode}>{mark(code)}</Text>
              </SelectionSquircle>
              <View style={styles.listContent}>
                <Text style={styles.title} numberOfLines={1}>
                  {name}
                </Text>
                {describe?.(code) ? <Text style={styles.subtitle}>{describe(code)}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      </BottomSheet>
    </>
  );
}
