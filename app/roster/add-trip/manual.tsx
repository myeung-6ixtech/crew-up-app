import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BodyText,
  Button,
  DateTimeField,
  Input,
  NumericText,
  Screen,
  combineDateAndTime,
} from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { airportLocalToUtc } from '@/lib/airportTime';
import { formatFlightDateLabel, fromFlightDateKey, toFlightDateKey } from '@/lib/flightDateKey';
import { useThemedStyles } from '@/theme';

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

  const styles = useThemedStyles((theme) => ({
    scroll: { flexGrow: 1, paddingBottom: theme.spacing.xxxl },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    title: {
      ...theme.typography.headline,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    route: { color: theme.colors.textPrimary, textAlign: 'center' },
    hint: { textAlign: 'center', maxWidth: 320, marginTop: theme.spacing.sm },
    form: { paddingHorizontal: theme.spacing.lg },
    footer: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    error: { color: theme.colors.statusOnDuty, textAlign: 'center' },
  }));

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
        <View style={[styles.header, styles.footer]}>
          <BodyText style={styles.error}>{t('addTrip.invalidSearchParams')}</BodyText>
          <Button label={t('common.back')} onPress={() => router.back()} noTopMargin />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{t('addTrip.enterFlightManually')}</Text>
          <NumericText style={styles.route}>
            {origin.iata} → {destination.iata}
          </NumericText>
          <BodyText muted>{formatFlightDateLabel(date)}</BodyText>
          <BodyText muted style={styles.hint}>
            {t('addTrip.manualFlightHint', {
              origin: origin.iata,
              destination: destination.iata,
            })}
          </BodyText>
        </View>

        <View style={styles.form}>
          <Input
            label={t('addTrip.manualFlightNumber')}
            value={flightNumber}
            onChangeText={setFlightNumber}
            placeholder={t('addTrip.manualFlightNumberPlaceholder')}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Input
            label={t('addTrip.manualAirline')}
            value={airlineIata}
            onChangeText={setAirlineIata}
            placeholder={t('addTrip.manualAirlinePlaceholder')}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <DateTimeField
            dateLabel={t('addTrip.manualDepartureDate', {
              airport: origin.iata,
            })}
            timeLabel={t('addTrip.manualDepartureTime', {
              airport: origin.iata,
            })}
            date={departureDate}
            time={departureTime}
            onDateChange={setDepartureDate}
            onTimeChange={setDepartureTime}
            datePlaceholder={t('addTrip.selectFlightDate')}
            timePlaceholder={t('addTrip.manualDepartureTime', {
              airport: origin.iata,
            })}
          />
          <DateTimeField
            dateLabel={t('addTrip.manualArrivalDate', {
              airport: destination.iata,
            })}
            timeLabel={t('addTrip.manualArrivalTime', {
              airport: destination.iata,
            })}
            date={arrivalDate}
            time={arrivalTime}
            onDateChange={setArrivalDate}
            onTimeChange={setArrivalTime}
            datePlaceholder={t('addTrip.selectFlightDate')}
            timePlaceholder={t('addTrip.manualArrivalTime', {
              airport: destination.iata,
            })}
            minimumDate={departureDate}
          />
        </View>

        <View style={styles.footer}>
          {error ? <BodyText style={styles.error}>{error}</BodyText> : null}
          <Button label={t('common.continue')} onPress={onContinue} noTopMargin />
          <Button
            label={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            noTopMargin
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
