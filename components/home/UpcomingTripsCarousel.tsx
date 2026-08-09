import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Card,
  BodyText,
  NumericText,
  StatusDot,
  SectionLabel,
  EmptyState,
} from '@/components/ui';
import { HOME_SECTION_PADDING, HOME_SECTION_SPACING } from '@/constants/homeLayout';
import { useThemedStyles } from '@/theme';
import { formatDateRange } from '@/lib/utils';
import { rosterRouteLabel, rosterToDisplayStatus } from '@/lib/dutyStatus';
import type { RosterEntry } from '@/types/domain';

export function UpcomingTripsCarousel({
  trips,
  embedded = false,
}: {
  trips: RosterEntry[];
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles((t) => ({
    section: {
      paddingHorizontal: embedded ? 0 : HOME_SECTION_PADDING,
      marginBottom: embedded ? 0 : HOME_SECTION_SPACING,
      width: '100%',
      alignItems: 'center',
    },
    scroll: {
      gap: t.spacing.md,
      paddingHorizontal: embedded ? 0 : undefined,
    },
    card: { width: embedded ? '100%' : 168, marginRight: embedded ? 0 : t.spacing.md },
    cardGap: { marginBottom: embedded ? t.spacing.md : 0 },
    cardInner: { gap: t.spacing.xs },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  }));

  const tripCards = trips.map((trip) => (
    <View key={trip.id} style={[styles.card, embedded && styles.cardGap]}>
      <Card>
        <View style={styles.cardInner}>
          <View style={styles.headerRow}>
            <StatusDot status={rosterToDisplayStatus(trip)} size={8} compact />
            <BodyText strong numberOfLines={1}>
              {rosterRouteLabel(trip)}
            </BodyText>
          </View>
          <NumericText muted>
            {formatDateRange(trip.layover_start ?? '', trip.layover_end)}
          </NumericText>
          {trip.layover_city ? <BodyText muted>{trip.layover_city}</BodyText> : null}
        </View>
      </Card>
    </View>
  ));

  return (
    <View style={styles.section}>
      {!embedded ? <SectionLabel>{t('home.upcomingTrips')}</SectionLabel> : null}

      {trips.length ? (
        embedded ? (
          <View style={{ width: '100%' }}>{tripCards}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {tripCards}
          </ScrollView>
        )
      ) : (
        <EmptyState title={t('home.emptyTrips')} body={t('home.emptyTripsBody')} />
      )}
    </View>
  );
}
