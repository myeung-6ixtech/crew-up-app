import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@crewup/shared';
import { hapticWarning } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import { SearchGlyph, TogglePill } from './kit';

export const MAX_LANGUAGES = 10;

/** Search + lime pill picker for languages. At least one, up to ten; the last one can't be removed. */
export function LanguagePills({
  value,
  onChange,
  error,
}: {
  value: string[];
  onChange: (codes: string[]) => void;
  error?: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return LANGUAGES;
    return LANGUAGES.filter(
      ([code, name, native]) =>
        name.toLowerCase().includes(normalized) || native.toLowerCase().includes(normalized) || code === normalized,
    );
  }, [query]);

  const toggle = (code: string) => {
    const has = value.includes(code);
    if (has && value.length === 1) return;
    if (!has && value.length >= MAX_LANGUAGES) {
      hapticWarning();
      return;
    }
    onChange(has ? value.filter((item) => item !== code) : [...value, code]);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, color: theme.colors.textSecondary }}>
          {t('onboarding.about.languagesHint')}
        </Text>
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.accentText }}>
          {`${value.length} / ${MAX_LANGUAGES}`}
        </Text>
      </View>
      <View
        style={{
          height: 48,
          borderRadius: 24,
          backgroundColor: theme.colors.field,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 18,
          marginTop: 20,
        }}>
        <SearchGlyph />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.language.search')}
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel={t('onboarding.language.search')}
          autoCorrect={false}
          style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 15, color: theme.colors.textPrimary, padding: 0 }}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
        {filtered.map(([code, name, native]) => (
          <TogglePill
            key={code}
            label={name}
            accessibilityLabel={native === name ? name : `${name}, ${native}`}
            selected={value.includes(code)}
            onPress={() => toggle(code)}
          />
        ))}
        {!filtered.length ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textTertiary }}>
            {t('onboarding.language.noResults')}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, marginTop: 12 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
