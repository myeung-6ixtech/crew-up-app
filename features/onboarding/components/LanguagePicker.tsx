import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@crewup/shared';
import { PickerFieldShell, SelectionSquircle, usePickerFieldStyles } from '@/components/profile/pickerFieldShared';
import { AppIcon, BodyText, BottomSheet, Button, SearchInputField } from '@/components/ui';
import { useTheme } from '@/theme';

const LANGUAGE_NAMES = new Map(LANGUAGES.map(([code, name]) => [code, name]));

type LanguagePickerProps = {
  label: string;
  value: string[];
  onChange: (codes: string[]) => void;
  error?: string;
};

/** Multi-select of ISO 639-1 languages. */
export function LanguagePicker({ label, value, onChange, error }: LanguagePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const styles = usePickerFieldStyles();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return LANGUAGES;
    return LANGUAGES.filter(
      ([code, name, native]) =>
        name.toLowerCase().includes(normalized) ||
        native.toLowerCase().includes(normalized) ||
        code === normalized,
    );
  }, [query]);

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter((item) => item !== code) : [...value, code]);
  };

  const summary = value.map((code) => LANGUAGE_NAMES.get(code) ?? code).join(', ');

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <PickerFieldShell
        label={label}
        error={error}
        onPress={() => setOpen(true)}
        accessibilityHint={t('onboarding.language.select')}
        placeholder={!value.length}
        title={value.length ? summary : t('onboarding.language.select')}
        leading={
          <SelectionSquircle muted={!value.length}>
            <Text style={value.length ? styles.squircleCode : styles.squirclePlaceholder}>
              {value.length ? String(value.length) : '—'}
            </Text>
          </SelectionSquircle>
        }
      />

      <BottomSheet visible={open} onClose={close} title={label} scrollable={false} heightRatio={0.9}>
        <SearchInputField
          label={t('onboarding.language.search')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.language.search')}
        />
        <FlatList
          style={styles.list}
          data={filtered}
          keyExtractor={([code]) => code}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <BodyText muted style={{ textAlign: 'center' }}>
                {t('onboarding.language.noResults')}
              </BodyText>
            </View>
          }
          renderItem={({ item: [code, name, native] }) => {
            const selected = value.includes(code);
            return (
              <Pressable
                onPress={() => toggle(code)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [
                  styles.listRow,
                  selected ? styles.listRowSelected : null,
                  { opacity: pressed ? 0.82 : 1 },
                ]}>
                <View style={styles.listContent}>
                  <Text style={styles.title}>{name}</Text>
                  {native !== name ? <Text style={styles.subtitle}>{native}</Text> : null}
                </View>
                <AppIcon
                  name={selected ? 'checkboxOn' : 'checkboxOff'}
                  size={22}
                  color={selected ? theme.colors.accentText : theme.colors.textTertiary}
                />
              </Pressable>
            );
          }}
        />
        <Button label={t('onboarding.language.done')} onPress={close} />
      </BottomSheet>
    </>
  );
}
