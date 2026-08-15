import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlightSearchResults } from '@/components/roster/FlightSearchResults';
import { FlightSearchResultsSkeleton } from '@/components/roster/FlightSearchResultsSkeleton';
import { BodyText, Button } from '@/components/ui';
import { fromFlightDateKey, toFlightDateKey } from '@/lib/flightDateKey';
import { searchFlights } from '@/services/flightService';
import type { FlightOption, FlightSearchErrorCode } from '@/types/flight';
import { toFlightSearchErrorCode } from '@/types/flight';
import { useThemedStyles } from '@/theme';

const ERROR_MESSAGE_KEYS: Record<FlightSearchErrorCode, string> = {
  FLIGHT_API_NOT_CONFIGURED: 'addTrip.flightApiNotConfigured',
  FLIGHT_API_RATE_LIMIT: 'addTrip.flightApiRateLimit',
  FLIGHT_API_QUOTA_EXCEEDED: 'addTrip.flightApiQuotaExceeded',
  FLIGHT_API_PLAN_LIMIT: 'addTrip.flightApiPlanLimit',
  FLIGHT_API_REQUEST_FAILED: 'addTrip.flightSearchError',
};

const RETRYABLE_ERRORS: readonly FlightSearchErrorCode[] = [
  'FLIGHT_API_RATE_LIMIT',
  'FLIGHT_API_REQUEST_FAILED',
];

type TripFlightSearchViewProps = {
  depIata: string;
  arrIata: string;
  flightDate: Date;
  selectedFlight: FlightOption | null;
  onSelectFlight: (flight: FlightOption) => void;
};

export function TripFlightSearchView({
  depIata,
  arrIata,
  flightDate,
  selectedFlight,
  onSelectFlight,
}: TripFlightSearchViewProps) {
  const { t } = useTranslation();
  const [flights, setFlights] = useState<FlightOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<FlightSearchErrorCode | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const dateKey = toFlightDateKey(flightDate);

  const styles = useThemedStyles((t) => ({
    wrap: {
      width: '100%',
      gap: t.spacing.md,
    },
    errorWrap: {
      width: '100%',
      alignItems: 'center',
      gap: t.spacing.xs,
    },
    error: {
      color: t.colors.statusOnDuty,
      textAlign: 'center',
    },
  }));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorCode(null);

    void (async () => {
      try {
        const results = await searchFlights({
          depIata,
          arrIata,
          flightDate: fromFlightDateKey(dateKey),
        });
        if (cancelled) return;
        setFlights(results);
      } catch (e) {
        if (cancelled) return;
        setFlights([]);
        setErrorCode(toFlightSearchErrorCode(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [depIata, arrIata, dateKey, retryToken]);

  if (loading) {
    return (
      <View style={styles.wrap}>
        <FlightSearchResultsSkeleton />
      </View>
    );
  }

  if (errorCode) {
    return (
      <View style={styles.errorWrap}>
        <BodyText style={styles.error}>{t(ERROR_MESSAGE_KEYS[errorCode])}</BodyText>
        {RETRYABLE_ERRORS.includes(errorCode) ? (
          <Button
            label={t('common.retry')}
            onPress={() => setRetryToken((token) => token + 1)}
            variant="ghost"
            noTopMargin
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FlightSearchResults
        flights={flights}
        selectedFlightId={selectedFlight?.id}
        onSelect={onSelectFlight}
      />
    </View>
  );
}
