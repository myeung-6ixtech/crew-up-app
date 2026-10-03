import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WhenTiles } from '@/components/events/WhenTiles';
import { FlowFooter, FlowHeader, FlowTopBar } from '@/components/roster/flowKit';
import { Screen, combineDateAndTime } from '@/components/ui';
import { FilledField, MonoLabel, MonoTag } from '@/features/onboarding/components/kit';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { airportLocalToUtc } from '@/lib/airportTime';
import { formatFlightDateLabel, fromFlightDateKey, toFlightDateKey } from '@/lib/flightDateKey';
import { fontFamily, useTheme } from '@/theme';

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

/**
 * Fallback for routes a schedule provider does not cover. Values are entered in
 * each airport's local time and converted to UTC before they reach the backend,
 * which validates them again before persisting the leg.
 */
export default function AddTripManualFlightScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { depIata, arrIata, date } = useLocalSearchParams<{
    depIata?: string;
    arrIata?: string;
    date?: string;
  }>();

  const origin = useMemo(() => findAirportByIata(depIata), [depIata]);
  const destination = useMemo(() => findAirportByIata(arrIata), [arrIata]);
  const flightDate = useMemo(() => (date ? fromFlightDateKey(date) : null), [date]);
  const paramsValid = Boolean(origin && destination && flightDate && date);

  const [flightNumber, setFlightNumber] = useState('');
  const [airlineIata, setAirlineIata] = useState('');
  const [departureDate, setDepartureDate] = useState(flightDate ?? new Date());
  const [departureTime, setDepartureTime] = useState(flightDate ?? new Date());
  const [arrivalDate, setArrivalDate] = useState(flightDate ?? new Date());
  const [arrivalTime, setArrivalTime] = useState(flightDate ?? new Date());
  const [error, setError] = useState('');

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const onContinue = () => {
    if (!origin || !destination || !date) return;

    const normalizedFlightNumber = flightNumber.replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z0-9]{2,8}$/.test(normalizedFlightNumber)) {
      setError(t('addTrip.manualFlightNumberError'));
      return;
    }

    const normalizedAirline = airlineIata.replace(/\s+/g, '').toUpperCase();
    if (normalizedAirline && !/^[A-Z0-9]{2,3}$/.test(normalizedAirline)) {
      setError(t('addTrip.manualAirlineError'));
      return;
    }

    const departureUtc = airportLocalToUtc(
      combineDateAndTime(departureDate, departureTime),
      origin.iata,
    );
    const arrivalUtc = airportLocalToUtc(
      combineDateAndTime(arrivalDate, arrivalTime),
      destination.iata,
    );

    if (arrivalUtc.getTime() <= departureUtc.getTime()) {
      setError(t('addTrip.manualArrivalError'));
      return;
    }

    setError('');
    router.push({
      pathname: SCREENS.roster.addTripAvailability,
      params: {
        depIata: origin.iata,
        arrIata: destination.iata,
        date,
        flightNumber: normalizedFlightNumber,
        arrivalTime: arrivalUtc.toISOString(),
        destinationCity: destination.city,
        manualFlightNumber: normalizedFlightNumber,
        manualAirlineIata: normalizedAirline,
        // The service day is the local departure date, not a UTC slice.
        manualServiceDate: toFlightDateKey(combineDateAndTime(departureDate, departureTime)),
        manualDepartureUtc: departureUtc.toISOString(),
        manualArrivalUtc: arrivalUtc.toISOString(),
      },
    });
  };

  if (!paramsValid || !origin || !destination || !date) {
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

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <FlowTopBar backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          <FlowHeader
            title={t('addTrip.enterFlightManually')}
            chip={`${origin.iata} → ${destination.iata}`}
            date={formatFlightDateLabel(date)}
            hint={t('addTrip.manualFlightHint', { origin: origin.iata, destination: destination.iata })}
          />
          <View style={{ paddingTop: 22, paddingHorizontal: 24 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <FilledField
                style={{ flex: 1.4 }}
                label={t('addTrip.manualFlightNumber')}
                value={flightNumber}
                onChangeText={(value) => setFlightNumber(value.toUpperCase())}
                placeholder={t('addTrip.manualFlightNumberPlaceholder')}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <FilledField
                style={{ flex: 1 }}
                label={t('addTrip.manualAirlineShort')}
                value={airlineIata}
                onChangeText={(value) => setAirlineIata(value.toUpperCase())}
                placeholder={t('addTrip.manualAirlinePlaceholder')}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={3}
                trailing={<MonoTag label={t('addTrip.optShort')} />}
              />
            </View>
            <MonoLabel style={{ fontSize: 10.5, marginTop: 10, marginBottom: 10 }}>{t('addTrip.departsLocal', { airport: origin.iata })}</MonoLabel>
            <WhenTiles
              date={departureDate}
              time={departureTime}
              onDateChange={setDepartureDate}
              onTimeChange={setDepartureTime}
              dateLabel={t('addTrip.manualDepartureDate', { airport: origin.iata })}
              timeLabel={t('addTrip.manualDepartureTime', { airport: origin.iata })}
              dateFormat={DATE_FORMAT}
              hour12={false}
            />
            <MonoLabel style={{ fontSize: 10.5, marginTop: 20, marginBottom: 10 }}>{t('addTrip.arrivesLocal', { airport: destination.iata })}</MonoLabel>
            <WhenTiles
              date={arrivalDate}
              time={arrivalTime}
              onDateChange={setArrivalDate}
              onTimeChange={setArrivalTime}
              minimumDate={departureDate}
              dateLabel={t('addTrip.manualArrivalDate', { airport: destination.iata })}
              timeLabel={t('addTrip.manualArrivalTime', { airport: destination.iata })}
              dateFormat={DATE_FORMAT}
              hour12={false}
              error={error === t('addTrip.manualArrivalError') ? error : undefined}
            />
            {error ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, marginTop: 12 }}>{error}</Text>
            ) : null}
          </View>
        </ScrollView>
        <FlowFooter
          bottomInset={insets.bottom}
          primary={{ label: t('common.continue'), onPress: onContinue }}
          tertiary={{ label: t('common.back'), onPress: () => router.back() }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
