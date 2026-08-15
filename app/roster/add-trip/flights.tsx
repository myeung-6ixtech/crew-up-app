import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TripFlightSearchView } from '@/components/roster/TripFlightSearchView';
import { BodyText, Button, NumericText, Screen } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { encodeDutyNote } from '@/lib/dutyStatus';
import { formatFlightDateLabel, fromFlightDateKey } from '@/lib/flightDateKey';
import { useApolloClient } from '@/lib/apolloHooks';
import { useAuth } from '@/hooks/useSession';
import { insertRosters } from '@/services/rosterService';
import type { FlightOption } from '@/types/flight';
import { useThemedStyles } from '@/theme';

export default function AddTripFlightsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const { depIata, arrIata, date } = useLocalSearchParams<{
    depIata?: string;
    arrIata?: string;
    date?: string;
  }>();

  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const origin = useMemo(() => findAirportByIata(depIata), [depIata]);
  const destination = useMemo(() => findAirportByIata(arrIata), [arrIata]);
  const flightDate = useMemo(() => (date ? fromFlightDateKey(date) : null), [date]);
  const paramsValid = Boolean(origin && destination && flightDate && date);

  const styles = useThemedStyles((t) => ({
    scroll: {
      flexGrow: 1,
      paddingBottom: t.spacing.xxxl,
    },
    header: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.lg,
      paddingBottom: t.spacing.xl,
      alignItems: 'center',
      gap: t.spacing.xs,
    },
    title: {
      ...t.typography.headline,
      color: t.colors.textPrimary,
      textAlign: 'center',
    },
    route: {
      color: t.colors.textPrimary,
      textAlign: 'center',
    },
    date: {
      textAlign: 'center',
    },
    hint: {
      textAlign: 'center',
      maxWidth: 320,
      marginTop: t.spacing.sm,
    },
    results: {
      paddingHorizontal: t.spacing.lg,
    },
    footer: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.xl,
      gap: t.spacing.sm,
    },
    error: {
      color: t.colors.statusOnDuty,
      textAlign: 'center',
    },
  }));

  const onSave = async () => {
    if (!userId || !origin || !destination || !selectedFlight) return;

    setSaving(true);
    setError('');
    try {
      const flight = selectedFlight;
      await insertRosters(client, [
        {
          flight_number: flight.flightNumber,
          departure_airport: origin.iata,
          arrival_airport: destination.iata,
          layover_city: destination.city.toUpperCase(),
          layover_start: flight.departureTime,
          layover_end: flight.arrivalTime,
          source: 'manual',
          notes: encodeDutyNote('flight'),
        },
      ]);
      router.replace(SCREENS.tabs.home);
    } catch {
      setError(t('addTrip.addTripError'));
    } finally {
      setSaving(false);
    }
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
          />
        </View>

        <View style={styles.footer}>
          {error ? <BodyText style={styles.error}>{error}</BodyText> : null}
          <Button
            label={t('addTrip.addTrip')}
            onPress={onSave}
            loading={saving}
            disabled={!selectedFlight || !userId}
            noTopMargin
          />
          <Button label={t('common.back')} onPress={() => router.back()} variant="ghost" noTopMargin />
        </View>
      </ScrollView>
    </Screen>
  );
}
