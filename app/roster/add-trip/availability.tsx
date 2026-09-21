import { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BodyText,
  Button,
  DateTimeField,
  NumericText,
  Screen,
  combineDateAndTime,
} from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import {
  airportLocalToUtc,
  formatAirportDate,
  formatAirportTimeWithZone,
  utcToAirportLocalWallClock,
} from '@/lib/airportTime';
import { formatFlightDateLabel } from '@/lib/flightDateKey';
import { createTrip, type TripLegInput } from '@/services/tripService';
import { useThemedStyles } from '@/theme';

export default function AddTripAvailabilityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    depIata,
    arrIata,
    date,
    selectionToken,
    flightNumber,
    arrivalTime,
    destinationCity,
    manualFlightNumber,
    manualAirlineIata,
    manualServiceDate,
    manualDepartureUtc,
    manualArrivalUtc,
  } = useLocalSearchParams<{
    depIata?: string;
    arrIata?: string;
    date?: string;
    selectionToken?: string;
    flightNumber?: string;
    arrivalTime?: string;
    destinationCity?: string;
    manualFlightNumber?: string;
    manualAirlineIata?: string;
    manualServiceDate?: string;
    manualDepartureUtc?: string;
    manualArrivalUtc?: string;
  }>();

  const idempotencyKeyRef = useRef(
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    }),
  );

  // Crew think about their free window in the city they land in, so the pickers
  // hold destination-local wall-clock values and only convert to UTC on save.
  const arrivalLocal = useMemo(
    () => utcToAirportLocalWallClock(arrivalTime, arrIata) ?? new Date(),
    [arrivalTime, arrIata],
  );
  const defaultFreeUntil = useMemo(() => {
    const end = new Date(arrivalLocal);
    end.setHours(end.getHours() + 8);
    return end;
  }, [arrivalLocal]);

  const [freeFromDate, setFreeFromDate] = useState(arrivalLocal);
  const [freeFromTime, setFreeFromTime] = useState(arrivalLocal);
  const [freeUntilDate, setFreeUntilDate] = useState(defaultFreeUntil);
  const [freeUntilTime, setFreeUntilTime] = useState(defaultFreeUntil);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const origin = useMemo(() => findAirportByIata(depIata), [depIata]);
  const destination = useMemo(() => findAirportByIata(arrIata), [arrIata]);

  const manualLeg = useMemo(() => {
    if (
      !manualFlightNumber ||
      !manualServiceDate ||
      !manualDepartureUtc ||
      !manualArrivalUtc ||
      !depIata ||
      !arrIata
    ) {
      return null;
    }
    return {
      flight_number: manualFlightNumber,
      airline_iata: manualAirlineIata || null,
      departure_airport: depIata.toUpperCase(),
      arrival_airport: arrIata.toUpperCase(),
      service_date: manualServiceDate,
      scheduled_departure: manualDepartureUtc,
      scheduled_arrival: manualArrivalUtc,
    };
  }, [
    manualFlightNumber,
    manualAirlineIata,
    manualServiceDate,
    manualDepartureUtc,
    manualArrivalUtc,
    depIata,
    arrIata,
  ]);

  const paramsValid = Boolean(
    origin && destination && date && flightNumber && arrivalTime && (selectionToken || manualLeg),
  );

  const styles = useThemedStyles((theme) => ({
    scroll: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xxxl,
    },
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
    route: {
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    hint: {
      textAlign: 'center',
      maxWidth: 320,
      marginTop: theme.spacing.sm,
    },
    form: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    footer: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    error: {
      color: theme.colors.statusOnDuty,
      textAlign: 'center',
    },
  }));

  const onSave = async () => {
    const leg: TripLegInput | null = selectionToken
      ? { selection_token: selectionToken }
      : manualLeg
        ? { manual: manualLeg }
        : null;
    if (!leg || !destinationCity) return;

    // Picker values are destination-local; the backend stores UTC instants.
    const freeFrom = airportLocalToUtc(combineDateAndTime(freeFromDate, freeFromTime), arrIata);
    const freeUntil = airportLocalToUtc(combineDateAndTime(freeUntilDate, freeUntilTime), arrIata);
    if (freeUntil.getTime() <= freeFrom.getTime()) {
      setError(t('addTrip.freeUntilError'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createTrip({
        source: manualLeg ? 'manual' : 'flight_search',
        idempotencyKey: idempotencyKeyRef.current,
        legs: [leg],
        stays: [
          {
            city: destinationCity.toUpperCase(),
            airport_iata: arrIata?.toUpperCase() ?? null,
            starts_at: freeFrom.toISOString(),
            ends_at: freeUntil.toISOString(),
          },
        ],
      });
      setSaved(true);
      router.replace(SCREENS.tabs.home);
    } catch {
      setError(t('addTrip.saveTripError'));
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.title}>{t('addTrip.whenFree')}</Text>
          <NumericText style={styles.route}>
            {flightNumber} · {origin.iata} → {destination.iata}
          </NumericText>
          <BodyText muted>{formatFlightDateLabel(date)}</BodyText>
          <BodyText muted>
            {t('addTrip.landsAt', {
              time: formatAirportTimeWithZone(arrivalTime, destination.iata),
              date: formatAirportDate(arrivalTime, destination.iata),
            })}
          </BodyText>
          <BodyText muted style={styles.hint}>
            {t('addTrip.availabilityHint', {
              city: destinationCity ?? destination.city,
            })}
          </BodyText>
        </View>

        <View style={styles.form}>
          <DateTimeField
            dateLabel={t('addTrip.freeFrom')}
            timeLabel={t('addTrip.freeFromTime')}
            date={freeFromDate}
            time={freeFromTime}
            onDateChange={setFreeFromDate}
            onTimeChange={setFreeFromTime}
            datePlaceholder={t('addTrip.selectFlightDate')}
            timePlaceholder={t('addTrip.freeFromTime')}
          />
          <DateTimeField
            dateLabel={t('addTrip.freeUntil')}
            timeLabel={t('addTrip.freeUntilTime')}
            date={freeUntilDate}
            time={freeUntilTime}
            onDateChange={setFreeUntilDate}
            onTimeChange={setFreeUntilTime}
            datePlaceholder={t('addTrip.selectFlightDate')}
            timePlaceholder={t('addTrip.freeUntilTime')}
            minimumDate={freeFromDate}
          />
        </View>

        <View style={styles.footer}>
          {error ? <BodyText style={styles.error}>{error}</BodyText> : null}
          <Button
            label={saved ? t('addTrip.tripSavedFindingMatches') : t('addTrip.saveTrip')}
            onPress={onSave}
            loading={saving}
            disabled={saving}
            noTopMargin
          />
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
