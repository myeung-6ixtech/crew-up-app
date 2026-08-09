import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, BodySmText, NumericText } from '@/components/ui';
import { AirportPickerModal } from '@/components/roster/AirportPickerModal';
import type { Airport, RouteEndpoint } from '@/types/airport';
import { useThemedStyles, useTheme } from '@/theme';

type RouteSelectorProps = {
  origin?: Airport;
  destination?: Airport;
  defaultOriginIata?: string | null;
  onChangeOrigin: (airport: Airport) => void;
  onChangeDestination: (airport: Airport) => void;
};

function RouteEndpointCard({
  airport,
  placeholder,
  active,
  onPress,
}: {
  airport?: Airport;
  placeholder: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    card: {
      flex: 1,
      minHeight: 112,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: active ? t.colors.accent : t.colors.hairline,
      backgroundColor: active ? t.colors.accentSubtle : t.colors.bgSurfaceRaised,
      paddingVertical: t.spacing.lg,
      paddingHorizontal: t.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.xs,
    },
    code: {
      ...t.typography.numericLg,
      color: airport ? t.colors.textPrimary : t.colors.textTertiary,
    },
    city: {
      ...t.typography.bodySm,
      color: t.colors.textSecondary,
      textAlign: 'center',
    },
    placeholder: {
      ...t.typography.bodyStrong,
      color: t.colors.textTertiary,
      textAlign: 'center',
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.82 : 1 }]}>
      {airport ? (
        <>
          <NumericText style={styles.code}>{airport.iata}</NumericText>
          <Text style={styles.city} numberOfLines={2}>
            {airport.city}
          </Text>
        </>
      ) : (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
    </Pressable>
  );
}

export function RouteSelector({
  origin,
  destination,
  defaultOriginIata,
  onChangeOrigin,
  onChangeDestination,
}: RouteSelectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [picker, setPicker] = useState<RouteEndpoint | null>(null);

  const styles = useThemedStyles((t) => ({
    wrap: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.lg,
      alignItems: 'center',
    },
    title: {
      ...t.typography.headline,
      color: t.colors.textPrimary,
      textAlign: 'center',
      marginBottom: t.spacing.xl,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      width: '100%',
      marginBottom: t.spacing.md,
    },
    connector: {
      width: 36,
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.xs,
    },
    swapHit: {
      minWidth: 36,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hint: {
      ...t.typography.bodySm,
      color: t.colors.textTertiary,
      textAlign: 'center',
    },
  }));

  const swapEndpoints = () => {
    if (!origin || !destination) return;
    onChangeOrigin(destination);
    onChangeDestination(origin);
  };

  const pickerTitle =
    picker === 'origin' ? t('addTrip.selectOrigin') : t('addTrip.selectDestination');

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('addTrip.searchByRoute')}</Text>

      <View style={styles.routeRow}>
        <RouteEndpointCard
          airport={origin}
          placeholder={t('addTrip.from')}
          active={picker === 'origin'}
          onPress={() => setPicker('origin')}
        />

        <View style={styles.connector}>
          <AppIcon name="chevronRight" size={20} color={theme.colors.textTertiary} />
          <Pressable
            onPress={swapEndpoints}
            disabled={!origin || !destination}
            style={({ pressed }) => [
              styles.swapHit,
              { opacity: !origin || !destination ? 0.35 : pressed ? 0.72 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('addTrip.swapRoute')}>
            <BodySmText style={{ color: theme.colors.accent, fontFamily: theme.typography.headline.fontFamily }}>
              ⇄
            </BodySmText>
          </Pressable>
        </View>

        <RouteEndpointCard
          airport={destination}
          placeholder={t('addTrip.to')}
          active={picker === 'destination'}
          onPress={() => setPicker('destination')}
        />
      </View>

      <Text style={styles.hint}>{t('addTrip.routeHint')}</Text>

      <AirportPickerModal
        visible={picker !== null}
        title={pickerTitle}
        selectedIata={picker === 'origin' ? origin?.iata : destination?.iata}
        excludeIata={picker === 'origin' ? destination?.iata : origin?.iata}
        preferIata={picker === 'origin' ? defaultOriginIata ?? undefined : undefined}
        onClose={() => setPicker(null)}
        onSelect={(airport) => {
          if (picker === 'origin') onChangeOrigin(airport);
          if (picker === 'destination') onChangeDestination(airport);
          setPicker(null);
        }}
      />
    </View>
  );
}
