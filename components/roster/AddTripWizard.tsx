import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteSelector } from '@/components/roster/RouteSelector';
import { BodyText, Button, HeadlineText } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import type { Airport } from '@/types/airport';
import { useThemedStyles } from '@/theme';

export type AddTripDraft = {
  origin?: Airport;
  destination?: Airport;
};

type AddTripWizardProps = {
  defaultOriginIata?: string | null;
  onCancel: () => void;
};

export function AddTripWizard({ defaultOriginIata, onCancel }: AddTripWizardProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<AddTripDraft>({});

  useEffect(() => {
    const base = findAirportByIata(defaultOriginIata);
    if (base) {
      setDraft((prev) => (prev.origin ? prev : { ...prev, origin: base }));
    }
  }, [defaultOriginIata]);

  const routeReady = Boolean(draft.origin && draft.destination);

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
      alignItems: 'center',
      gap: t.spacing.md,
      minHeight: 200,
      justifyContent: 'center',
    },
    footer: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.xl,
    },
  }));

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <RouteSelector
        origin={draft.origin}
        destination={draft.destination}
        defaultOriginIata={defaultOriginIata}
        onChangeOrigin={(origin) => setDraft((prev) => ({ ...prev, origin }))}
        onChangeDestination={(destination) => setDraft((prev) => ({ ...prev, destination }))}
      />

      <View style={styles.divider} />

      <View style={[styles.scheduleSection, { opacity: routeReady ? 1 : 0.45 }]}>
        <HeadlineText style={{ textAlign: 'center' }}>{t('addTrip.whenFlying')}</HeadlineText>
        <BodyText muted style={{ textAlign: 'center', maxWidth: 320 }}>
          {routeReady
            ? t('addTrip.scheduleComingSoon')
            : t('addTrip.selectRouteFirst')}
        </BodyText>
      </View>

      <View style={styles.footer}>
        <Button label={t('common.cancel')} onPress={onCancel} variant="ghost" noTopMargin />
      </View>
    </ScrollView>
  );
}
