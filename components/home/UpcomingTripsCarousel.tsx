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
import { useThemedStyles } from '@/theme';
import { formatDateRange } from '@/lib/utils';
import { rosterRouteLabel, rosterToDisplayStatus } from '@/lib/dutyStatus';
import type { RosterEntry } from '@/types/domain';

export function UpcomingTripsCarousel({ trips }: { trips: RosterEntry[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles((t) => ({
    scroll: { paddingHorizontal: t.spacing.lg, gap: t.spacing.md },
    card: {
      width: 168,
      marginRight: t.spacing.md,
    },
    cardInner: { gap: t.spacing.xs },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    section: { marginBottom: t.spacing.xl },
  }));

  return (
    <View style={styles.section}>
      <SectionLabel>{t('home.upcomingTrips')}</SectionLabel>
      {trips.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {trips.map((trip) => (
            <View key={trip.id} style={styles.card}>
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
          ))}
        </ScrollView>
      ) : (
        <EmptyState title={t('home.emptyTrips')} body={t('home.emptyTripsBody')} />
      )}
    </View>
  );
}
