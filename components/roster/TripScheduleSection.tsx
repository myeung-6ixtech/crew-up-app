import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlightDateSelector } from '@/components/roster/FlightDateSelector';
import { BodyText } from '@/components/ui';
import type { Airport } from '@/types/airport';
import { useThemedStyles } from '@/theme';

type TripScheduleSectionProps = {
  origin?: Airport;
  destination?: Airport;
  flightDate: Date | null;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
};

export function TripScheduleSection({
  origin,
  destination,
  flightDate,
  onDateChange,
  disabled = false,
}: TripScheduleSectionProps) {
  const { t } = useTranslation();
  const minimumDate = useMemo(() => new Date(), []);

  const styles = useThemedStyles((t) => ({
    wrap: {
      width: '100%',
      alignItems: 'center',
    },
    title: {
      ...t.typography.headline,
      color: t.colors.textPrimary,
      textAlign: 'center',
      marginBottom: t.spacing.xl,
    },
    hint: {
      ...t.typography.bodySm,
      color: t.colors.textTertiary,
      textAlign: 'center',
      maxWidth: 320,
      marginTop: t.spacing.md,
    },
  }));

  return (
    <View style={[styles.wrap, { opacity: disabled ? 0.45 : 1 }]}>
      <Text style={styles.title}>{t('addTrip.whenFlying')}</Text>

      {disabled ? (
        <BodyText muted style={styles.hint}>
          {t('addTrip.selectRouteFirst')}
        </BodyText>
      ) : (
        <>
          <FlightDateSelector
            value={flightDate}
            onChange={onDateChange}
            placeholder={t('addTrip.selectFlightDate')}
            minimumDate={minimumDate}
            active={Boolean(flightDate)}
          />

          {flightDate && origin && destination ? (
            <BodyText muted style={[styles.hint, { marginTop: 24 }]}>
              {t('addTrip.searchFlightsHint', {
                origin: origin.iata,
                destination: destination.iata,
              })}
            </BodyText>
          ) : null}
        </>
      )}
    </View>
  );
}
