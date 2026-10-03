import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlightOptionCard } from '@/components/roster/FlightOptionCard';
import { FlightSearchResultsSkeleton } from '@/components/roster/FlightSearchResultsSkeleton';
import { CloudOffGlyph, FlowFooter, FlowHeader, FlowNotice, FlowTopBar, PlaneGlyph } from '@/components/roster/flowKit';
import { Screen } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { formatFlightDateLabel, fromFlightDateKey } from '@/lib/flightDateKey';
import { searchFlights } from '@/services/flightService';
import { fontFamily, useTheme } from '@/theme';
import type { FlightOption, FlightSearchErrorCode } from '@/types/flight';
import { toFlightSearchErrorCode } from '@/types/flight';

/** Select your flight: that day's departures, one selectable card each. Empty or unavailable always offers manual entry. */
export default function AddTripFlightsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { depIata, arrIata, date } = useLocalSearchParams<{ depIata?: string; arrIata?: string; date?: string }>();
  const origin = useMemo(() => findAirportByIata(depIata), [depIata]);
  const destination = useMemo(() => findAirportByIata(arrIata), [arrIata]);
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<FlightSearchErrorCode | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [selected, setSelected] = useState<FlightOption | null>(null);

  useEffect(() => {
    if (!origin || !destination || !date) return undefined;
    let cancelled = false;
    setLoading(true);
    setErrorCode(null);
    void searchFlights({ depIata: origin.iata, arrIata: destination.iata, flightDate: fromFlightDateKey(date) })
      .then((result) => {
        if (!cancelled) setFlights(result.flights);
      })
      .catch((e) => {
        if (cancelled) return;
        setFlights([]);
        setErrorCode(toFlightSearchErrorCode(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, destination, origin, retryToken]);

  const manual = () =>
    origin && destination && date && router.push({ pathname: SCREENS.roster.addTripManual, params: { depIata: origin.iata, arrIata: destination.iata, date } });

  const proceed = () => {
    if (!selected?.selectionToken || !origin || !destination || !date) return;
    router.push({
      pathname: SCREENS.roster.addTripAvailability,
      params: {
        depIata: origin.iata,
        arrIata: destination.iata,
        date,
        selectionToken: selected.selectionToken,
        flightNumber: selected.flightNumber,
        arrivalTime: selected.arrivalTime,
        destinationCity: destination.city,
      },
    });
  };

  const back = { label: t('common.back'), onPress: () => router.back() };

  if (!origin || !destination || !date) {
    return (
      <Screen style={{ padding: 0 }}>
        <View style={{ paddingTop: insets.top }}>
          <FlowTopBar backLabel={t('common.back')} onBack={() => router.back()} />
        </View>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.statusOnDuty, textAlign: 'center', marginTop: 60, paddingHorizontal: 24 }}>
          {t('addTrip.invalidSearchParams')}
        </Text>
      </Screen>
    );
  }

  const empty = !loading && !errorCode && flights.length === 0;
  const retryable = errorCode === 'FLIGHT_SCHEDULE_UNAVAILABLE' || errorCode === 'FLIGHT_SEARCH_FAILED';

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <FlowTopBar backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <FlowHeader
        title={t('addTrip.selectFlight')}
        chip={`${origin.iata} → ${destination.iata}`}
        date={formatFlightDateLabel(date)}
        hint={t('addTrip.flightSearchHint', { origin: origin.iata, destination: destination.iata })}
      />

      {errorCode ? (
        <FlowNotice
          icon={<CloudOffGlyph color={theme.colors.textTertiary} />}
          title={errorCode === 'FLIGHT_SEARCH_UNAUTHENTICATED' ? t('addTrip.flightSearchSignedOut') : t('addTrip.unavailableTitle')}
          body={errorCode === 'FLIGHT_SEARCH_UNAUTHENTICATED' ? t('addTrip.signedOutBody') : t('addTrip.unavailableBody')}
        />
      ) : empty ? (
        <FlowNotice icon={<PlaneGlyph color={theme.colors.textTertiary} size={26} />} title={t('addTrip.noFlightsFound')} body={t('addTrip.noFlightsFoundHint')} />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
          {loading ? (
            <FlightSearchResultsSkeleton />
          ) : (
            flights.map((flight) => (
              <FlightOptionCard
                key={flight.id}
                flight={flight}
                selected={selected?.id === flight.id}
                onPress={() => setSelected((current) => (current?.id === flight.id ? null : flight))}
              />
            ))
          )}
        </ScrollView>
      )}

      {errorCode ? (
        retryable ? (
          <FlowFooter
            bottomInset={insets.bottom}
            primary={{ label: t('common.retry'), onPress: () => setRetryToken((token) => token + 1) }}
            secondary={{ label: t('addTrip.enterFlightManually'), onPress: manual }}
            tertiary={back}
          />
        ) : (
          <FlowFooter bottomInset={insets.bottom} primary={{ label: t('addTrip.enterFlightManually'), onPress: manual }} tertiary={back} />
        )
      ) : empty ? (
        <FlowFooter bottomInset={insets.bottom} primary={{ label: t('addTrip.enterFlightManually'), onPress: manual }} tertiary={back} />
      ) : (
        <FlowFooter bottomInset={insets.bottom} primary={{ label: t('common.continue'), disabled: !selected?.selectionToken, onPress: proceed }} tertiary={back} />
      )}
    </Screen>
  );
}
