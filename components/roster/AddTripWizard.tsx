import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RouteSelector } from '@/components/roster/RouteSelector';
import { TripScheduleSection } from '@/components/roster/TripScheduleSection';
import { Button } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { toFlightDateKey } from '@/lib/flightDateKey';
import type { Airport } from '@/types/airport';
import { useThemedStyles } from '@/theme';

export type AddTripDraft = {
  origin?: Airport;
  destination?: Airport;
  flightDate?: Date;
};

type AddTripWizardProps = {
  defaultOriginIata?: string | null;
  onCancel: () => void;
};

export function AddTripWizard({ defaultOriginIata, onCancel }: AddTripWizardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [draft, setDraft] = useState<AddTripDraft>({});

  useEffect(() => {
    const base = findAirportByIata(defaultOriginIata);
    if (base) {
      setDraft((prev) => (prev.origin ? prev : { ...prev, origin: base }));
    }
  }, [defaultOriginIata]);

  const routeReady = Boolean(draft.origin && draft.destination);
  const canSearch = Boolean(routeReady && draft.flightDate);

  const styles = useThemedStyles((t) => ({
    scroll: {
      flexGrow: 1,
      paddingBottom: t.spacing.xxxl,
    },
    divider: {
      height: 1,
      backgroundColor: t.colors.hairline,
      marginHorizontal: t.spacing.lg,
      marginVertical: t.spacing.xl,
    },
    scheduleSection: {
      paddingHorizontal: t.spacing.lg,
    },
    footer: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.xl,
      gap: t.spacing.sm,
    },
  }));

  const onSearchFlights = () => {
    if (!draft.origin || !draft.destination || !draft.flightDate) return;

    router.push({
      pathname: SCREENS.roster.addTripFlights,
      params: {
        depIata: draft.origin.iata,
        arrIata: draft.destination.iata,
        date: toFlightDateKey(draft.flightDate),
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <RouteSelector
        origin={draft.origin}
        destination={draft.destination}
        defaultOriginIata={defaultOriginIata}
        onChangeOrigin={(origin) =>
          setDraft((prev) => ({
            ...prev,
            origin,
          }))
        }
        onChangeDestination={(destination) =>
          setDraft((prev) => ({
            ...prev,
            destination,
          }))
        }
      />

      <View style={styles.divider} />

      <View style={styles.scheduleSection}>
        <TripScheduleSection
          origin={draft.origin}
          destination={draft.destination}
          flightDate={draft.flightDate ?? null}
          onDateChange={(flightDate) =>
            setDraft((prev) => ({
              ...prev,
              flightDate,
            }))
          }
          disabled={!routeReady}
        />
      </View>

      <View style={styles.footer}>
        <Button
          label={t('addTrip.searchFlights')}
          onPress={onSearchFlights}
          disabled={!canSearch}
          noTopMargin
        />
        <Button label={t('common.cancel')} onPress={onCancel} variant="ghost" noTopMargin />
      </View>
    </ScrollView>
  );
}
