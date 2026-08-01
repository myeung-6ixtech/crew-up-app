import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ApolloClient } from '@apollo/client';
import {
  BottomSheet,
  Button,
  Input,
  LabelText,
  SelectionOption,
  Subtitle,
} from '@/components/ui';
import { VISIBILITY_LEVELS, type VisibilityLevel } from '@/constants/screens';
import { encodeDutyNote, type DutyType } from '@/lib/dutyStatus';
import { insertRosters } from '@/services/rosterService';
import { updateProfile } from '@/services/profileService';
import type { Profile } from '@/types/domain';

function toIsoDate(value: string, endOfDay = false): string | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T${endOfDay ? '23:59:59' : '00:00:00'}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function AddTripSheet({
  visible,
  onClose,
  client,
  userId,
  profile,
  onSaved,
  refreshProfile,
}: {
  visible: boolean;
  onClose: () => void;
  client: ApolloClient;
  userId: string;
  profile: Profile | null;
  onSaved: () => void;
  refreshProfile: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const [flightNumber, setFlightNumber] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dutyType, setDutyType] = useState<DutyType>('layover');
  const [visibility, setVisibility] = useState<VisibilityLevel>(
    profile?.default_visibility ?? 'friends',
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setFlightNumber('');
    setOrigin('');
    setDestination('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setDutyType('layover');
    setVisibility(profile?.default_visibility ?? 'friends');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSave = async () => {
    setError('');
    const start = toIsoDate(startDate);
    const end = toIsoDate(endDate || startDate, true);
    if (!start || !end) {
      setError(t('home.addTripDateError'));
      return;
    }

    if (dutyType === 'off') {
      handleClose();
      onSaved();
      return;
    }

    if (dutyType === 'layover' && !city.trim()) {
      setError(t('home.addTripCityError'));
      return;
    }

    if (dutyType === 'flight' && (!origin.trim() || !destination.trim())) {
      setError(t('home.addTripRouteError'));
      return;
    }

    setLoading(true);
    try {
      const layoverCity =
        dutyType === 'layover'
          ? city.trim().toUpperCase()
          : destination.trim().toUpperCase();

      await insertRosters(client, [
        {
          flight_number: flightNumber.trim() || null,
          departure_airport: origin.trim().toUpperCase() || null,
          arrival_airport: destination.trim().toUpperCase() || null,
          layover_city: layoverCity,
          layover_start: start,
          layover_end: end,
          source: 'manual',
          notes: encodeDutyNote(dutyType),
        },
      ]);

      if (visibility !== profile?.default_visibility) {
        await updateProfile(client, userId, { default_visibility: visibility });
        await refreshProfile();
      }

      reset();
      onClose();
      onSaved();
    } catch {
      setError(t('home.addTripSaveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={handleClose} title={t('home.addTrip')}>
      <Input
        label={t('home.flightNumber')}
        value={flightNumber}
        onChangeText={setFlightNumber}
        placeholder="CX123"
      />

      <LabelText>{t('home.dutyType')}</LabelText>
      {(['flight', 'layover', 'off'] as const).map((d) => (
        <SelectionOption
          key={d}
          label={t(`home.duty.${d}`)}
          selected={dutyType === d}
          onPress={() => setDutyType(d)}
        />
      ))}

      {dutyType === 'flight' ? (
        <>
          <Input label={t('home.origin')} value={origin} onChangeText={setOrigin} placeholder="HKG" />
          <Input
            label={t('home.destination')}
            value={destination}
            onChangeText={setDestination}
            placeholder="NRT"
          />
        </>
      ) : null}

      {dutyType === 'layover' ? (
        <Input label={t('home.layoverCity')} value={city} onChangeText={setCity} placeholder="NRT" />
      ) : null}

      <Input
        label={t('home.startDate')}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="2026-08-01"
      />
      <Input
        label={t('home.endDate')}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="2026-08-03"
      />

      <Subtitle>{t('home.tripVisibility')}</Subtitle>
      <Subtitle>{t('home.tripVisibilityHint')}</Subtitle>
      {VISIBILITY_LEVELS.filter((v) => v !== 'off').map((v) => (
        <SelectionOption
          key={v}
          label={v.replace(/_/g, ' ')}
          selected={visibility === v}
          onPress={() => setVisibility(v)}
        />
      ))}

      {error ? <Subtitle>{error}</Subtitle> : null}

      <View style={{ marginTop: 8 }}>
        <Button label={t('common.save')} onPress={onSave} loading={loading} noTopMargin />
        <Button label={t('common.cancel')} onPress={handleClose} variant="ghost" />
      </View>
    </BottomSheet>
  );
}
