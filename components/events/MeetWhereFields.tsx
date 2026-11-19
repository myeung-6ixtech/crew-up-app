import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { PickerFieldVariantProvider } from '@/components/profile/pickerFieldShared';
import { FilledField } from '@/features/onboarding/components/kit';
import { CityPickerField } from './CityPickerField';
import { VenuePickerField } from './VenuePickerField';

/** The searched place behind a venue: stored with the meet. Null for a custom venue. */
export type VenuePlaceRef = { placeId: string; lat: number | null; lng: number | null } | null;

type MeetWhereFieldsProps = {
  city: string;
  cityError?: string;
  onCityChange: (city: string) => void;
  venue: string;
  onVenueChange: (venue: string) => void;
  address: string;
  onAddressChange: (address: string) => void;
  venuePlace: VenuePlaceRef;
  onVenuePlaceChange: (place: VenuePlaceRef) => void;
  /** The meet's activities (slugs), so nearby venue suggestions suit them. */
  activitySlugs?: string[];
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
  venuePlace,
  onVenuePlaceChange,
  activitySlugs,
}: MeetWhereFieldsProps) {
  const { t } = useTranslation();

  return (
    <PickerFieldVariantProvider value="filled">
      <View>
        <CityPickerField
          label={t('events.city')}
          value={city}
          onChange={(next) => {
            // A venue belongs to its city: a new city clears it (and the address it filled) and re-scopes the search.
            if (next !== city && (venue || venuePlace)) {
              onVenueChange('');
              if (venuePlace) onAddressChange('');
              onVenuePlaceChange(null);
            }
            onCityChange(next);
          }}
          error={cityError}
        />
        <VenuePickerField
          label={t('events.venue')}
          value={venue}
          city={city}
          activitySlugs={activitySlugs}
          placeholder={t('events.venuePlaceholder')}
          onSelect={(place) => {
            onVenueChange(place.venue);
            // The address is only filled when it's empty; a typed address is kept.
            if (place.address && !address.trim()) onAddressChange(place.address);
            onVenuePlaceChange(place.placeId ? { placeId: place.placeId, lat: place.lat, lng: place.lng } : null);
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
