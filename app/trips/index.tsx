import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlowTitle, FlowTopBar, PlaneGlyph } from '@/components/roster/flowKit';
import { NoTripsCard, TripCard } from '@/components/roster/TripCard';
import { Screen, Toast } from '@/components/ui';
import { useAddTripFlow } from '@/hooks/useAddTripFlow';
import { useAuth } from '@/hooks/useSession';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSelection, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { deactivateTrip, fetchTripHistory } from '@/services/tripService';
import { fontFamily, useTheme } from '@/theme';
import type { TripEntry } from '@/types/trip';

type TripTab = 'upcoming' | 'past';

/** Your trips: Add Trip opens the same method sheet as Home; each upcoming card can be removed. */
export default function TripsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const { userId } = useAuth();
  const { openAddTrip, addTripMethodOverlay } = useAddTripFlow();
  const [tab, setTab] = useState<TripTab>('upcoming');
  const [upcoming, setUpcoming] = useState<TripEntry[]>([]);
  const [past, setPast] = useState<TripEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await fetchTripHistory(client, userId);
      setUpcoming(result.upcoming);
      setPast(result.past);
    } finally {
      setLoading(false);
    }
  }, [client, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const remove = (trip: TripEntry) => {
    hapticWarning();
    Alert.alert(t('trips.removeTitle'), t('trips.removeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('trips.removeTrip'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivateTrip(client, trip.id);
            hapticSuccess();
            setUpcoming((current) => current.filter((item) => item.id !== trip.id));
            setToast(t('trips.removedToast'));
          } catch {
            hapticError();
            setToast(t('onboarding.genericError'));
          }
        },
      },
    ]);
  };

  const trips = tab === 'upcoming' ? upcoming : past;

  return (
    <Screen style={{ padding: 0 }}>
      {addTripMethodOverlay}
      <View style={{ paddingTop: insets.top }}>
        <FlowTopBar backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: insets.bottom + 32 }}>
        <FlowTitle>{t('trips.yourTrips')}</FlowTitle>
        <Pressable
          accessibilityRole="button"
          onPress={openAddTrip}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 28,
            marginTop: 16,
            backgroundColor: pressed ? theme.colors.accentPressed : theme.colors.fill,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          })}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, lineHeight: 24, color: theme.colors.onFill }}>+</Text>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.onFill }}>{t('discover.addTrip')}</Text>
        </Pressable>
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
          {(['upcoming', 'past'] as TripTab[]).map((value) => {
            const selected = tab === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => {
                  hapticSelection();
                  setTab(value);
                }}
                style={{ height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: selected ? theme.colors.ink : theme.colors.field, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: selected ? theme.colors.ground : theme.colors.textPrimary }}>
                  {t(`trips.${value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ gap: 10, marginTop: 16 }}>
          {loading ? (
            <ActivityIndicator color={theme.colors.accentText} style={{ marginTop: 32 }} />
          ) : trips.length ? (
            trips.map((trip) => <TripCard key={trip.id} trip={trip} onRemove={tab === 'upcoming' ? () => remove(trip) : undefined} />)
          ) : tab === 'upcoming' ? (
            <NoTripsCard icon={<PlaneGlyph color={theme.colors.textSecondary} />} />
          ) : (
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 24 }}>
              {t('trips.emptyPast')}
            </Text>
          )}
        </View>
      </ScrollView>
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
    </Screen>
  );
}
