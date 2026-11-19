import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ActivityIcon } from '@/components/icons/ActivityIcon';
import { BottomSheet } from '@/components/ui';
import { FilledPressField, MonoLabel } from '@/features/onboarding/components/kit';
import { currentLocation, locationAccess } from '@/lib/deviceLocation';
import { hapticSelection } from '@/lib/haptics';
import { distanceMeters, formatDistance, nearbyTypesFor, venueIcon } from '@/lib/venueCategory';
import { nearbyVenues, searchVenues, venueAt, venueDetails, type VenueSuggestion } from '@/services/placeService';
import { fontFamily, useTheme } from '@/theme';

/** What the form stores for a venue. A custom venue has a name only. */
export type PickedVenue = {
  venue: string;
  address: string;
  city: string | null;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
};

type VenuePickerFieldProps = {
  label: string;
  value: string;
  city: string;
  placeholder: string;
  /** The meet's activities (slugs): nearby suggestions look for places that suit them. */
  activitySlugs?: string[];
  onSelect: (place: PickedVenue) => void;
};

type LatLng = { lat: number; lng: number };
/** A row the user can pick: a place from search or nearby, the current location, or a custom name. */
type Choice = { kind: 'place'; place: VenueSuggestion } | { kind: 'custom'; name: string };

const INK = '#0E1113';
const LIME = '#A8E05F';
const SEARCH_DEBOUNCE_MS = 300;

function newSessionToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function PinGlyph({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M10 18s6-5.4 6-10a6 6 0 10-12 0c0 4.6 6 10 6 10z" stroke={color} strokeWidth={1.7} fill="none" strokeLinejoin="round" />
      <Circle cx={10} cy={8} r={2.2} stroke={color} strokeWidth={1.7} fill="none" />
    </Svg>
  );
}

function LocateGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={6} stroke={color} strokeWidth={1.7} fill="none" />
      <Circle cx={10} cy={10} r={2} fill={color} />
      <Path d="M10 1.5V4M10 16v2.5M1.5 10H4M16 10h2.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function CheckGlyph({ color }: { color: string }) {
  return (
    <Svg width={12} height={10} viewBox="0 0 13 10">
      <Path d="M1 5l3.6 3.6L12 1.2" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseGlyph({ color }: { color: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 10 10">
      <Path d="M1 1l8 8M9 1L1 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** The activity icon for a place (café → Coffee, gym → Gym…), or a pin. */
function VenueBadge({ types, dark }: { types?: string[]; dark?: boolean }) {
  const theme = useTheme();
  const slug = venueIcon(types);
  const color = dark ? INK : theme.colors.textPrimary;
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: dark ? LIME : theme.colors.field,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {slug ? <ActivityIcon slug={slug} name="" size={22} color={color} /> : <PinGlyph color={color} />}
    </View>
  );
}

/**
 * Tappable venue field. The sheet (frame 3D·3) searches places in the meet's city, suggests nearby ones before you
 * type, and can use your current location. Picking a row marks it and pins it in a SELECTED card; "Use {venue}"
 * confirms. No match (or no connection) offers the typed name as a custom venue. Close keeps the previous venue.
 */
export function VenuePickerField({ label, value, city, placeholder, activitySlugs = [], onSelect }: VenuePickerFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VenueSuggestion[]>([]);
  const [nearby, setNearby] = useState<VenueSuggestion[]>([]);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [cityLabel, setCityLabel] = useState<string | null>(null);
  const [userAt, setUserAt] = useState<LatLng | null>(null);
  const [locationAllowed, setLocationAllowed] = useState<boolean | null>(null);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [offline, setOffline] = useState(false);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [confirming, setConfirming] = useState(false);
  const sessionToken = useRef(newSessionToken());
  const typesKey = nearbyTypesFor(activitySlugs).join(',');
  const trimmed = query.trim();

  // Opening the sheet: nearby places in the city, and your location if you've already allowed it (never asks here).
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setOffline(false);
    setNearby([]);
    // No city yet: nothing to suggest nearby (search still works).
    if (city.trim()) void nearbyVenues(city, typesKey ? typesKey.split(',') : [], controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setNearby(next.places);
        setCenter(next.center);
        setCityLabel(next.cityLabel);
      })
      .catch(() => {
        if (!controller.signal.aborted) setOffline(true);
      });
    void locationAccess()
      .then(async (access) => {
        if (controller.signal.aborted) return;
        // "Use current location" shows when it's allowed or can still be asked; never when refused or unavailable.
        setLocationAllowed(access === 'granted' ? true : access === 'ask' ? null : false);
        if (access !== 'granted') return;
        const at = await currentLocation({ ask: false });
        if (!controller.signal.aborted && at) setUserAt(at);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [city, open, typesKey]);

  // Typing: autocomplete in the city, 300 ms after the last keystroke.
  useEffect(() => {
    if (!open) return undefined;
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      void searchVenues(trimmed, city, sessionToken.current, controller.signal, { center, origin: userAt ?? center })
        .then((places) => {
          if (controller.signal.aborted) return;
          setResults(places);
          setOffline(false);
        })
        .catch((failure: unknown) => {
          if (controller.signal.aborted || (failure instanceof Error && failure.name === 'AbortError')) return;
          setResults([]);
          setOffline(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [center, city, open, trimmed, userAt]);

  const reset = () => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setConfirming(false);
    setOffline(false);
  };
  const close = () => {
    setOpen(false);
    reset();
  };

  /** Distance from you when location is allowed, otherwise from the city centre. */
  const distanceOf = (place: VenueSuggestion) => {
    if (typeof place.distanceMeters === 'number') return formatDistance(place.distanceMeters);
    const from = userAt ?? center;
    return from && typeof place.lat === 'number' && typeof place.lng === 'number' ? formatDistance(distanceMeters(from, { lat: place.lat, lng: place.lng })) : '';
  };

  const pick = (choice: Choice) => {
    hapticSelection();
    setSelected(choice);
    AccessibilityInfo.announceForAccessibility(t('events.venueSelectedA11y', { name: choice.kind === 'place' ? choice.place.name : choice.name }));
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const at = await currentLocation({ ask: true });
      if (!at) {
        setLocationAllowed(false);
        return;
      }
      setLocationAllowed(true);
      setUserAt(at);
      const place = await venueAt(at);
      if (place) pick({ kind: 'place', place: { ...place, distanceMeters: 0 } });
      else setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setLocating(false);
    }
  };

  const confirm = async () => {
    if (!selected) return;
    if (selected.kind === 'custom') {
      onSelect({ venue: selected.name, address: '', city: null, placeId: null, lat: null, lng: null });
      close();
      return;
    }
    const place = selected.place;
    // Nearby rows and the current location already have their address and coordinates; search rows need details.
    if (place.address !== undefined && typeof place.lat === 'number') {
      onSelect({ venue: place.name, address: place.address || place.detail, city: place.city ?? null, placeId: place.id, lat: place.lat, lng: place.lng ?? null });
      close();
      return;
    }
    setConfirming(true);
    try {
      const details = await venueDetails(place.id, sessionToken.current);
      onSelect({
        venue: details.name || place.name,
        address: details.address || place.detail,
        city: details.city,
        placeId: details.id ?? place.id,
        lat: details.lat ?? null,
        lng: details.lng ?? null,
      });
      close();
    } catch {
      setConfirming(false);
      setOffline(true);
    }
  };

  const selectedName = selected ? (selected.kind === 'place' ? selected.place.name : selected.name) : '';
  const isSelected = (place: VenueSuggestion) => selected?.kind === 'place' && selected.place.id === place.id;
  const shownCity = cityLabel || city;
  const rows = trimmed.length >= 2 ? results : nearby;
  const noResults = trimmed.length >= 2 && !searching && !results.length;

  const placeRow = (place: VenueSuggestion) => {
    const on = isSelected(place);
    const distance = distanceOf(place);
    return (
      <Pressable
        key={place.id}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        accessibilityLabel={[place.name, place.detail, distance].filter(Boolean).join(', ')}
        onPress={() => pick({ kind: 'place', place })}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: on ? LIME : 'transparent',
          backgroundColor: pressed ? theme.colors.field : 'transparent',
        })}>
        <VenueBadge types={place.types} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>
            {place.name}
          </Text>
          {place.detail ? (
            <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
              {place.detail}
            </Text>
          ) : null}
        </View>
        {distance ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textSecondary }}>{distance}</Text> : null}
        {on ? (
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' }}>
            <CheckGlyph color={INK} />
          </View>
        ) : null}
      </Pressable>
    );
  };

  const customRow = (name: string) => {
    const on = selected?.kind === 'custom' && selected.name === name;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        onPress={() => pick({ kind: 'custom', name })}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 12,
          marginTop: 8,
          borderRadius: 16,
          borderWidth: 1.5,
          borderStyle: on ? 'solid' : 'dashed',
          borderColor: on ? LIME : '#C9CEC1',
          opacity: pressed ? 0.75 : 1,
        })}>
        <VenueBadge />
        <Text style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{t('events.venueUseTyped', { name })}</Text>
        {on ? (
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' }}>
            <CheckGlyph color={INK} />
          </View>
        ) : null}
      </Pressable>
    );
  };

  const header = (
    <View style={{ gap: 12, paddingBottom: 8 }}>
      {selected ? (
        <View style={{ backgroundColor: INK, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <VenueBadge types={selected.kind === 'place' ? selected.place.types : undefined} dark />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <MonoLabel style={{ fontSize: 9.5, color: LIME }}>{t('events.venueSelected')}</MonoLabel>
            <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: '#EDF1F2' }}>
              {selectedName}
            </Text>
            {selected.kind === 'place' && selected.place.detail ? (
              <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: '#A7B1B5' }}>
                {selected.place.detail}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      {trimmed.length < 2 && locationAllowed !== false ? (
        <Pressable
          accessibilityRole="button"
          disabled={locating}
          onPress={() => void useCurrentLocation()}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, opacity: pressed ? 0.7 : 1 })}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accentSubtle, alignItems: 'center', justifyContent: 'center' }}>
            {locating ? <ActivityIndicator color={theme.colors.accentText} /> : <LocateGlyph color={theme.colors.accentText} />}
          </View>
          <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.accentText }}>{t('events.venueUseCurrentLocation')}</Text>
        </Pressable>
      ) : null}
      {offline ? (
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 19, color: theme.colors.textSecondary, paddingHorizontal: 4 }}>
          {t('events.venueOffline')}
        </Text>
      ) : null}
      {trimmed.length < 2 && nearby.length ? (
        <MonoLabel style={{ fontSize: 10.5, paddingHorizontal: 4, marginTop: 4 }}>{t('events.venueNearbyIn', { city: (shownCity.split(',')[0] || shownCity).toUpperCase() })}</MonoLabel>
      ) : null}
      {searching ? <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 8 }} /> : null}
    </View>
  );

  const footer = (
    <View style={{ paddingBottom: 12 }}>
      {noResults && !offline ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textTertiary, textAlign: 'center', paddingVertical: 12 }}>
          {t('events.venueSearchEmpty')}
        </Text>
      ) : null}
      {trimmed.length >= 2 && (noResults || offline) ? customRow(trimmed) : null}
    </View>
  );

  return (
    <>
      <FilledPressField
        label={label}
        value={value.trim() ? value : null}
        placeholder={placeholder}
        accessibilityHint={t('events.venueSearchIn', { city: city || t('events.city') })}
        onPress={() => {
          sessionToken.current = newSessionToken();
          reset();
          setOpen(true);
        }}
      />
      <BottomSheet visible={open} onClose={close} scrollable={false} heightRatio={0.94}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={close}
              hitSlop={8}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
              <CloseGlyph color={theme.colors.textPrimary} />
            </Pressable>
            <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, color: theme.colors.textPrimary }}>
              {t('events.venue')}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, borderRadius: 25, paddingHorizontal: 16, backgroundColor: theme.colors.field }}>
            <PinGlyph color={theme.colors.textTertiary} size={16} />
            <TextInput
              value={query}
              onChangeText={(next) => {
                setQuery(next);
                if (selected?.kind === 'custom') setSelected(null);
              }}
              placeholder={t('events.venueSearchIn', { city: (shownCity.split(',')[0] || shownCity) || t('events.city') })}
              placeholderTextColor={theme.colors.textTertiary}
              accessibilityLabel={t('events.venueSearchLabel')}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="search"
              style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 15, color: theme.colors.textPrimary }}
            />
          </View>
          {shownCity ? (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary, marginTop: 8, marginBottom: 10, paddingHorizontal: 4 }}>
              {t('events.venueSearchingIn', { place: shownCity })}
            </Text>
          ) : null}
          <FlatList
            style={{ flex: 1 }}
            data={rows}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            renderItem={({ item }) => placeRow(item)}
          />
          <View style={{ paddingTop: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !selected || confirming, busy: confirming }}
              disabled={!selected || confirming}
              onPress={() => void confirm()}
              style={({ pressed }) => ({
                height: 54,
                borderRadius: 27,
                backgroundColor: theme.colors.fill,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !selected ? 0.45 : pressed ? 0.85 : 1,
              })}>
              {confirming ? (
                <ActivityIndicator color={theme.colors.onFill} />
              ) : (
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.onFill, paddingHorizontal: 20 }}>
                  {selected ? t('events.venueUse', { name: selectedName }) : t('events.venueChoose')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

/** Slugs for the meet's selected activity ids, for nearby suggestions. */
export function useActivitySlugs(selectedIds: string[], catalog: { id: string; slug?: string | null }[]) {
  return useMemo(() => {
    const byId = new Map(catalog.map((item) => [item.id, item.slug ?? '']));
    return selectedIds.map((id) => byId.get(id) ?? '').filter(Boolean);
  }, [catalog, selectedIds]);
}
