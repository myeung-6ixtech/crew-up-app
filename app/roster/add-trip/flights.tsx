import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TripFlightSearchView } from '@/components/roster/TripFlightSearchView';
import { BodyText, Button, NumericText, Screen } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { formatFlightDateLabel, fromFlightDateKey } from '@/lib/flightDateKey';
import type { FlightOption } from '@/types/flight';
import { useThemedStyles } from '@/theme';

export default function AddTripFlightsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { depIata, arrIata, date } = useLocalSearchParams<{
    depIata?: string;
    arrIata?: string;
    date?: string;
  }>();

  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);

  const origin = useMemo(() => findAirportByIata(depIata), [depIata]);
  const destination = useMemo(() => findAirportByIata(arrIata), [arrIata]);
  const flightDate = useMemo(() => (date ? fromFlightDateKey(date) : null), [date]);
  const paramsValid = Boolean(origin && destination && flightDate && date);

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
    date: {
      textAlign: 'center',
    },
    hint: {
      textAlign: 'center',
      maxWidth: 320,
      marginTop: theme.spacing.sm,
    },
    results: {
      paddingHorizontal: theme.spacing.lg,
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

  const onManualEntry = () => {
    if (!origin || !destination || !date) return;
    router.push({
      pathname: SCREENS.roster.addTripManual,
      params: { depIata: origin.iata, arrIata: destination.iata, date },
    });
  };

  const onContinue = () => {
    if (!selectedFlight?.selectionToken || !origin || !destination || !date) return;
    router.push({
      pathname: SCREENS.roster.addTripAvailability,
      params: {
        depIata: origin.iata,
        arrIata: destination.iata,
        date,
        selectionToken: selectedFlight.selectionToken,
        flightNumber: selectedFlight.flightNumber,
        arrivalTime: selectedFlight.arrivalTime,
        destinationCity: destination.city,
      },
    });
  };

  if (!paramsValid || !origin || !destination || !flightDate || !date) {
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
          <Text style={styles.title}>{t('addTrip.selectFlight')}</Text>
          <NumericText style={styles.route}>
            {origin.iata} → {destination.iata}
          </NumericText>
          <BodyText muted style={styles.date}>
            {formatFlightDateLabel(date)}
          </BodyText>
          <BodyText muted style={styles.hint}>
            {t('addTrip.flightSearchHint', {
              origin: origin.iata,
              destination: destination.iata,
            })}
          </BodyText>
        </View>

        <View style={styles.results}>
          <TripFlightSearchView
            depIata={origin.iata}
            arrIata={destination.iata}
            flightDate={flightDate}
            selectedFlight={selectedFlight}
            onSelectFlight={setSelectedFlight}
            onManualEntry={onManualEntry}
          />
        </View>

        <View style={styles.footer}>
          <Button
            label={t('common.continue')}
            onPress={onContinue}
            disabled={!selectedFlight?.selectionToken}
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
