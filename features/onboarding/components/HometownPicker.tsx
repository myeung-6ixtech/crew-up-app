import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  PickerFieldShell,
  SelectionSquircle,
  usePickerFieldStyles,
} from '@/components/profile/pickerFieldShared';
import { countryName } from '@crewup/shared';
import { AppIcon, BodyText, BottomSheet, HapticPressable, SearchInputField } from '@/components/ui';
import { useTheme } from '@/theme';
import { searchHometowns, type PlaceHit } from '../services/placeSearch';

export type HometownValue = {
  name: string;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
};

type HometownPickerProps = {
  label: string;
  value: HometownValue | null;
  onChange: (value: HometownValue | null) => void;
  error?: string;
  /** Hometown can be cleared. Where you live cannot. */
  allowClear?: boolean;
};

export function HometownPicker({ label, value, onChange, error, allowClear = true }: HometownPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = usePickerFieldStyles();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

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
    setSearchError('');
  };

  return (
    <>
      <PickerFieldShell
        label={label}
        error={error}
        onPress={() => setOpen(true)}
        accessibilityHint={t('onboarding.about.hometownSearch')}
        placeholder={!value?.name}
        title={value?.name || t('onboarding.about.hometownPlaceholder')}
        subtitle={countryName(value?.countryCode) ?? null}
        leading={
          <SelectionSquircle muted={!value?.countryCode}>
            {value?.countryCode ? (
              <Text style={styles.squircleCode}>{value.countryCode}</Text>
            ) : (
              <AppIcon name="mapPoint" size={18} color={theme.colors.textTertiary} />
            )}
          </SelectionSquircle>
        }
      />

      <BottomSheet visible={open} onClose={close} title={label} scrollable={false} heightRatio={0.9}>
        <SearchInputField
          label={t('onboarding.about.hometownSearch')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.about.hometownPlaceholder')}
        />
        {allowClear && value?.name ? (
          <HapticPressable
            haptic="selection"
            onPress={() => {
              onChange(null);
              close();
            }}
            style={styles.listRow}>
            <Text style={styles.subtitle}>{t('onboarding.about.hometownClear')}</Text>
          </HapticPressable>
        ) : null}
        {searching ? (
          <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: theme.spacing.md }} />
        ) : null}
        <FlatList
          style={styles.list}
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searching ? null : (
              <View style={styles.empty}>
                <BodyText muted style={{ textAlign: 'center' }}>
                  {searchError ||
                    (query.trim().length < 2
                      ? t('onboarding.about.hometownHint')
                      : t('onboarding.about.hometownEmpty'))}
                </BodyText>
              </View>
            )
          }
          renderItem={({ item }) => (
            <HapticPressable
              haptic="selection"
              onPress={() => {
                onChange({
                  name: item.name,
                  countryCode: item.countryCode,
                  latitude: item.latitude,
                  longitude: item.longitude,
                });
                close();
              }}
              style={({ pressed }) => [styles.listRow, { opacity: pressed ? 0.82 : 1 }]}>
              <SelectionSquircle>
                <Text style={styles.squircleCode}>{item.countryCode}</Text>
              </SelectionSquircle>
              <View style={styles.listContent}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.detail ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {item.detail}
                  </Text>
                ) : null}
              </View>
            </HapticPressable>
          )}
        />
      </BottomSheet>
    </>
  );
}
