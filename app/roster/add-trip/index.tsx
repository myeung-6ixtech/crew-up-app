import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AirportPickerModal } from '@/components/roster/AirportPickerModal';
import { CalendarGlyph, FlowFooter, FlowTitle, FlowTopBar, SwapGlyph } from '@/components/roster/flowKit';
import { BottomSheet, Screen } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { MonoLabel, PillCta } from '@/features/onboarding/components/kit';
import { useAuth } from '@/hooks/useSession';
import { createDatePickerHandlers } from '@/lib/dateTimePickerHandlers';
import { toFlightDateKey } from '@/lib/flightDateKey';
import { hapticImpact } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { Airport, RouteEndpoint } from '@/types/airport';

function RouteCard({ label, airport, placeholder, onPress }: { label: string; airport?: Airport; placeholder: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={airport ? `${label}: ${airport.iata}, ${airport.city}` : label}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        height: 138,
        backgroundColor: theme.colors.card,
        borderRadius: 22,
        padding: 16,
        justifyContent: 'space-between',
        opacity: pressed ? 0.85 : 1,
      })}>
      <MonoLabel style={{ fontSize: 10, color: theme.colors.textTertiary }}>{label}</MonoLabel>
      {airport ? (
        <View style={{ gap: 2 }}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 40, lineHeight: 42, letterSpacing: -0.8, color: theme.colors.textPrimary }}>{airport.iata}</Text>
          <Text numberOfLines={1} style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary }}>
            {airport.city}
          </Text>
        </View>
      ) : (
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, color: theme.colors.textTertiary }}>{placeholder}</Text>
      )}
    </Pressable>
  );
}

/** Search by route: two airport cards with a swap, then the flight date. Departure starts at base. */
export default function AddTripScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [origin, setOrigin] = useState<Airport | undefined>();
  const [destination, setDestination] = useState<Airport | undefined>();
  const [flightDate, setFlightDate] = useState<Date | null>(null);
  const [picker, setPicker] = useState<RouteEndpoint | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const baseIata = profile?.base_airport_iata ?? profile?.base_airport;

  useEffect(() => {
    const base = findAirportByIata(baseIata);
    if (base) setOrigin((current) => current ?? base);
  }, [baseIata]);

  const routeReady = Boolean(origin && destination);
  const canSearch = Boolean(routeReady && flightDate);
  const params = origin && destination && flightDate ? { depIata: origin.iata, arrIata: destination.iata, date: toFlightDateKey(flightDate) } : null;
  const closeDate = () => setDateOpen(false);
  const dateHandlers = createDatePickerHandlers(setFlightDate, closeDate);

  const swap = () => {
    if (!origin && !destination) return;
    hapticImpact();
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <FlowTopBar backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
        <FlowTitle>{t('addTrip.searchByRoute')}</FlowTitle>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <RouteCard label={t('addTrip.departure')} airport={origin} placeholder={t('addTrip.departure')} onPress={() => setPicker('origin')} />
          <RouteCard label={t('addTrip.arrival')} airport={destination} placeholder={t('addTrip.arrival')} onPress={() => setPicker('destination')} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('addTrip.swapRoute')}
            onPress={swap}
            hitSlop={6}
            style={({ pressed }) => ({
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 44,
              height: 44,
              marginLeft: -22,
              marginTop: -22,
              borderRadius: 22,
              backgroundColor: '#0E1113',
              borderWidth: 4,
              borderColor: theme.colors.ground,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}>
            <SwapGlyph color="#A8E05F" />
          </Pressable>
        </View>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 10 }}>
          {t('addTrip.routeHint')}
        </Text>

        <View style={{ height: 1, backgroundColor: theme.colors.hairline, marginTop: 22 }} />
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary, textAlign: 'center', marginTop: 20 }}>
          {t('addTrip.whenFlying')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !routeReady }}
          disabled={!routeReady}
          onPress={() => {
            hapticImpact();
            setDateOpen(true);
          }}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.field,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 20,
            marginTop: 14,
            opacity: !routeReady ? 0.45 : pressed ? 0.85 : 1,
          })}>
          <CalendarGlyph color={theme.colors.textPrimary} />
          <Text style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15.5, color: flightDate ? theme.colors.textPrimary : theme.colors.textTertiary }}>
            {flightDate ? flightDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : t('addTrip.selectFlightDate')}
          </Text>
        </Pressable>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 19, color: theme.colors.textTertiary, textAlign: 'center', marginTop: 10 }}>
          {!routeReady ? t('addTrip.selectRouteFirst') : flightDate ? t('addTrip.searchFlightsHintShort') : ''}
        </Text>
      </ScrollView>

      <FlowFooter
        bottomInset={insets.bottom}
        primary={{ label: t('addTrip.searchFlights'), disabled: !canSearch, onPress: () => params && router.push({ pathname: SCREENS.roster.addTripFlights, params }) }}
        secondary={{ label: t('addTrip.addFlightManually'), disabled: !canSearch, onPress: () => params && router.push({ pathname: SCREENS.roster.addTripManual, params }) }}
        tertiary={{ label: t('common.cancel'), onPress: () => router.back() }}
      />

      <AirportPickerModal
        visible={picker !== null}
        title={picker === 'origin' ? t('addTrip.departure') : t('addTrip.arrival')}
        selectedIata={picker === 'origin' ? origin?.iata : destination?.iata}
        excludeIata={picker === 'origin' ? destination?.iata : origin?.iata}
        preferIata={picker === 'origin' ? (baseIata ?? undefined) : undefined}
        onClose={() => setPicker(null)}
        onSelect={(airport) => {
          if (picker === 'origin') setOrigin(airport);
          if (picker === 'destination') setDestination(airport);
          setPicker(null);
        }}
      />

      {dateOpen && Platform.OS !== 'android' ? (
        <BottomSheet visible onClose={closeDate} scrollable={false} heightRatio={0.46}>
          <View style={{ alignItems: 'center' }}>
            <DateTimePicker
              value={flightDate ?? today}
              mode="date"
              display="spinner"
              minimumDate={today}
              themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              {...dateHandlers}
            />
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <PillCta
              label={t('onboarding.language.done')}
              onPress={() => {
                if (!flightDate) setFlightDate(today);
                closeDate();
              }}
            />
          </View>
        </BottomSheet>
      ) : null}
      {dateOpen && Platform.OS === 'android' ? (
        <DateTimePicker value={flightDate ?? today} mode="date" display="default" minimumDate={today} {...dateHandlers} />
      ) : null}
    </Screen>
  );
}
