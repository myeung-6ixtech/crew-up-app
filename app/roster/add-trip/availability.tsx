import { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WhenTiles } from '@/components/events/WhenTiles';
import { FlowFooter, FlowHeader, FlowTopBar } from '@/components/roster/flowKit';
import { Screen, combineDateAndTime } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import {
  airportLocalToUtc,
  formatAirportDate,
  formatAirportTimeWithZone,
  utcToAirportLocalWallClock,
} from '@/lib/airportTime';
import { formatFlightDateLabel } from '@/lib/flightDateKey';
import { createTrip, type TripLegInput } from '@/services/tripService';
import { fontFamily, useTheme } from '@/theme';

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

function clock(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** The free window as crew will see it: hours free, a bar across the local day, landing and until times. */
function WindowCard({ from, until, zone, landLabel, untilLabel, title }: {
  from: Date;
  until: Date;
  zone: string;
  landLabel: string;
  untilLabel: string;
  title: string;
}) {
  const minutesOfDay = from.getHours() * 60 + from.getMinutes();
  const hours = Math.max(0, (until.getTime() - from.getTime()) / 3_600_000);
  const left = minutesOfDay / 1440;
  const width = Math.max(0.03, Math.min(1 - left, hours / 24));
  return (
    <View style={{ marginTop: 22, marginHorizontal: 24, backgroundColor: '#0E1113', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: '#EDF1F2' }}>{title}</Text>
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: '#A8E05F' }}>{zone}</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: '#2C3134' }}>
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${left * 100}%`, width: `${width * 100}%`, borderRadius: 4, backgroundColor: '#A8E05F' }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: '#A7B1B5' }}>{landLabel}</Text>
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: '#A7B1B5' }}>{untilLabel}</Text>
      </View>
    </View>
  );
}

export default function AddTripAvailabilityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    depIata,
    arrIata,
    date,
    selectionToken,
    flightNumber,
    arrivalTime,
    destinationCity,
    manualFlightNumber,
    manualAirlineIata,
    manualServiceDate,
    manualDepartureUtc,
    manualArrivalUtc,
  } = useLocalSearchParams<{
    depIata?: string;
    arrIata?: string;
    date?: string;
    selectionToken?: string;
    flightNumber?: string;
    arrivalTime?: string;
    destinationCity?: string;
    manualFlightNumber?: string;
    manualAirlineIata?: string;
    manualServiceDate?: string;
    manualDepartureUtc?: string;
    manualArrivalUtc?: string;
  }>();

  const idempotencyKeyRef = useRef(
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.floor(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    }),
  );

  // Crew think about their free window in the city they land in, so the pickers
  // hold destination-local wall-clock values and only convert to UTC on save.
  const arrivalLocal = useMemo(
    () => utcToAirportLocalWallClock(arrivalTime, arrIata) ?? new Date(),
    [arrivalTime, arrIata],
  );
  const defaultFreeUntil = useMemo(() => {
    const end = new Date(arrivalLocal);
    end.setHours(end.getHours() + 8);
    return end;
  }, [arrivalLocal]);

  const [freeFromDate, setFreeFromDate] = useState(arrivalLocal);
  const [freeFromTime, setFreeFromTime] = useState(arrivalLocal);
  const [freeUntilDate, setFreeUntilDate] = useState(defaultFreeUntil);
  const [freeUntilTime, setFreeUntilTime] = useState(defaultFreeUntil);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const origin = useMemo(() => findAirportByIata(depIata), [depIata]);
  const destination = useMemo(() => findAirportByIata(arrIata), [arrIata]);

  const manualLeg = useMemo(() => {
    if (
      !manualFlightNumber ||
      !manualServiceDate ||
      !manualDepartureUtc ||
      !manualArrivalUtc ||
      !depIata ||
      !arrIata
    ) {
      return null;
    }
    return {
      flight_number: manualFlightNumber,
      airline_iata: manualAirlineIata || null,
      departure_airport: depIata.toUpperCase(),
      arrival_airport: arrIata.toUpperCase(),
      service_date: manualServiceDate,
      scheduled_departure: manualDepartureUtc,
      scheduled_arrival: manualArrivalUtc,
    };
  }, [
    manualFlightNumber,
    manualAirlineIata,
    manualServiceDate,
    manualDepartureUtc,
    manualArrivalUtc,
    depIata,
    arrIata,
  ]);

  const paramsValid = Boolean(
    origin && destination && date && flightNumber && arrivalTime && (selectionToken || manualLeg),
  );

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const onSave = async () => {
    const leg: TripLegInput | null = selectionToken
      ? { selection_token: selectionToken }
      : manualLeg
        ? { manual: manualLeg }
        : null;
    if (!leg || !destinationCity) return;

    // Picker values are destination-local; the backend stores UTC instants.
    const freeFrom = airportLocalToUtc(combineDateAndTime(freeFromDate, freeFromTime), arrIata);
    const freeUntil = airportLocalToUtc(combineDateAndTime(freeUntilDate, freeUntilTime), arrIata);
    if (freeUntil.getTime() <= freeFrom.getTime()) {
      setError(t('addTrip.freeUntilError'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      await createTrip({
        source: manualLeg ? 'manual' : 'flight_search',
        idempotencyKey: idempotencyKeyRef.current,
        legs: [leg],
        stays: [
          {
            city: destinationCity.toUpperCase(),
            airport_iata: arrIata?.toUpperCase() ?? null,
            starts_at: freeFrom.toISOString(),
            ends_at: freeUntil.toISOString(),
          },
        ],
      });
      setSaved(true);
      // Let the "Trip saved! Finding matches…" label land before Home replaces this screen.
      setTimeout(() => router.replace(SCREENS.tabs.home), 900);
    } catch {
      setError(t('addTrip.saveTripError'));
    } finally {
      setSaving(false);
    }
  };

  if (!paramsValid || !origin || !destination || !date) {
    return (
      <Screen style={{ padding: 0 }}>
        <View style={{ paddingTop: insets.top }}>
          <FlowTopBar backLabel={t('common.back')} onBack={() => router.back()} />
        </View>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, color: theme.colors.statusOnDuty, textAlign: 'center', marginTop: 60, paddingHorizontal: 24 }}>
          {t('addTrip.invalidSearchParams')}
        </Text>
      </Screen>
    );
  }

  const cityName = destinationCity ?? destination.city;
  const landing = formatAirportTimeWithZone(arrivalTime, destination.iata);
  const zone = landing.slice(landing.lastIndexOf(' ') + 1);
  const freeFrom = combineDateAndTime(freeFromDate, freeFromTime);
  const freeUntil = combineDateAndTime(freeUntilDate, freeUntilTime);
  const freeHours = Math.max(0, Math.round((freeUntil.getTime() - freeFrom.getTime()) / 3_600_000));

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <FlowTopBar backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <FlowHeader
          title={t('addTrip.whenFree')}
          chip={`${flightNumber} · ${origin.iata} → ${destination.iata}`}
          date={formatFlightDateLabel(date)}
          accent={t('addTrip.landsAt', { time: landing, date: formatAirportDate(arrivalTime, destination.iata, { day: 'numeric', month: 'short' }) })}
          hint={t('addTrip.availabilityHint', { city: cityName })}
        />
        <WindowCard
          from={freeFrom}
          until={freeUntil}
          zone={zone}
          title={t('addTrip.hoursFreeIn', { count: freeHours, city: cityName })}
          landLabel={t('addTrip.landClock', { time: clock(arrivalLocal) })}
          untilLabel={t('addTrip.untilClock', { time: clock(freeUntil) })}
        />
        <View style={{ gap: 10, paddingTop: 18, paddingHorizontal: 24 }}>
          <WhenTiles
            date={freeFromDate}
            time={freeFromTime}
            onDateChange={setFreeFromDate}
            onTimeChange={setFreeFromTime}
            dateLabel={t('addTrip.freeFrom')}
            timeLabel={t('addTrip.freeFromTime')}
            dateFormat={DATE_FORMAT}
            hour12={false}
          />
          <WhenTiles
            date={freeUntilDate}
            time={freeUntilTime}
            onDateChange={setFreeUntilDate}
            onTimeChange={setFreeUntilTime}
            minimumDate={freeFromDate}
            dateLabel={t('addTrip.freeUntil')}
            timeLabel={t('addTrip.freeUntilTime')}
            dateFormat={DATE_FORMAT}
            hour12={false}
            error={error === t('addTrip.freeUntilError') ? error : undefined}
          />
          {error ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty }}>{error}</Text> : null}
        </View>
      </ScrollView>
      <FlowFooter
        bottomInset={insets.bottom}
        primary={{ label: saved ? t('addTrip.tripSavedFindingMatches') : t('addTrip.saveTrip'), onPress: () => void onSave(), loading: saving, disabled: saved }}
        tertiary={{ label: t('common.back'), onPress: () => router.back() }}
      />
    </Screen>
  );
}
