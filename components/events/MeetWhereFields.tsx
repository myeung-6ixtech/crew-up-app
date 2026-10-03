import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { PickerFieldVariantProvider } from '@/components/profile/pickerFieldShared';
import { findEventCity } from '@/constants/airports';
import { FilledField } from '@/features/onboarding/components/kit';
import { CityPickerField } from './CityPickerField';
import { VenuePickerField } from './VenuePickerField';

type MeetWhereFieldsProps = {
  city: string;
  cityError?: string;
  onCityChange: (city: string) => void;
  venue: string;
  onVenueChange: (venue: string) => void;
  address: string;
  onAddressChange: (address: string) => void;
};

/** City, venue, and address. Shared by creating a meet and editing one. */
export function MeetWhereFields({
  city,
  cityError,
  onCityChange,
  venue,
  onVenueChange,
  address,
  onAddressChange,
}: MeetWhereFieldsProps) {
  const { t } = useTranslation();

  return (
    <PickerFieldVariantProvider value="filled">
      <View>
        <CityPickerField label={t('events.city')} value={city} onChange={onCityChange} error={cityError} />
        <VenuePickerField
          label={t('events.venue')}
          value={venue}
          city={city}
          placeholder={t('events.venuePlaceholder')}
          onSelect={(place) => {
            onVenueChange(place.venue);
            if (place.address) onAddressChange(place.address);
            if (place.city) onCityChange(findEventCity(place.city)?.city ?? place.city);
          }}
        />
        <FilledField
          label={t('events.address')}
          value={address}
          onChangeText={onAddressChange}
          placeholder={t('onboarding.optionalTag')}
        />
      </View>
    </PickerFieldVariantProvider>
  );
}
