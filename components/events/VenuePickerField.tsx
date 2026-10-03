import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet, SearchInputField } from '@/components/ui';
import { FilledPressField } from '@/features/onboarding/components/kit';
import { searchVenues, venueDetails, type VenueSuggestion } from '@/services/placeService';
import { fontFamily, useTheme } from '@/theme';

type VenuePickerFieldProps = {
  label: string;
  value: string;
  city: string;
  placeholder: string;
  onSelect: (place: { venue: string; address: string; city: string | null }) => void;
};

function newSessionToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/** Tappable venue field. The sheet searches places and fills the Google address. */
export function VenuePickerField({ label, value, city, placeholder, onSelect }: VenuePickerFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VenueSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const sessionToken = useRef(newSessionToken());

  useEffect(() => {
    if (!open) return undefined;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setError('');
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setError('');
      void searchVenues(trimmed, city, sessionToken.current, controller.signal)
        .then((places) => {
          if (!controller.signal.aborted) setResults(places);
        })
        .catch((failure: unknown) => {
          if (controller.signal.aborted || (failure instanceof Error && failure.name === 'AbortError')) return;
          setResults([]);
          setError(t('events.venueSearchFailed'));
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [city, open, query, t]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setError('');
    setSelectingId(null);
  };

  const chooseTyped = () => {
    const venue = query.trim();
    if (!venue) return;
    onSelect({ venue, address: '', city: null });
    close();
  };

  const choosePlace = async (suggestion: VenueSuggestion) => {
    if (selectingId) return;
    setSelectingId(suggestion.id);
    setError('');
    try {
      const place = await venueDetails(suggestion.id, sessionToken.current);
      onSelect({
        venue: place.name || suggestion.name,
        address: place.address || suggestion.detail,
        city: place.city,
      });
      close();
    } catch {
      setError(t('events.venueSearchFailed'));
      setSelectingId(null);
    }
  };

  return (
    <>
      <FilledPressField
        label={label}
        value={value.trim() ? value : null}
        placeholder={placeholder}
        accessibilityHint={t('events.venueSearchPlaceholder')}
        onPress={() => {
          sessionToken.current = newSessionToken();
          setOpen(true);
        }}
      />
      <BottomSheet visible={open} onClose={close} title={label} scrollable={false} heightRatio={0.9}>
        <SearchInputField
          label={t('events.venueSearchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('events.venueSearchPlaceholder')}
          autoCapitalize="words"
        />
        {searching ? <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 16 }} /> : null}
        {error && results.length ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, marginTop: 8 }}>
            {error}
          </Text>
        ) : null}
        <FlatList
          style={{ flex: 1, marginTop: 8 }}
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            query.trim().length >= 2 && !searching ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center', paddingVertical: 24 }}>
                {error || t('events.venueSearchEmpty')}
              </Text>
            ) : null
          }
          ListFooterComponent={
            query.trim().length >= 2 ? (
              <Pressable
                accessibilityRole="button"
                onPress={chooseTyped}
                style={({ pressed }) => ({ paddingVertical: 14, paddingHorizontal: 8, opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.accentText }}>
                  {t('events.venueUseTyped', { name: query.trim() })}
                </Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(selectingId)}
              onPress={() => void choosePlace(item)}
              style={({ pressed }) => ({
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderRadius: 14,
                opacity: selectingId && selectingId !== item.id ? 0.45 : pressed ? 0.7 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15.5, color: theme.colors.textPrimary }}>{item.name}</Text>
              {item.detail ? (
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary, marginTop: 2 }}>
                  {item.detail}
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      </BottomSheet>
    </>
  );
}
