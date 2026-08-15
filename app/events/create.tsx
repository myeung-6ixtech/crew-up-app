import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { CityPickerField } from '@/components/events/CityPickerField';
import {
  Screen,
  Title,
  Input,
  Button,
  DateTimeField,
  combineDateAndTime,
  TagInputField,
  FormSection,
  PillSelectorGroup,
  NumberStepperField,
} from '@/components/ui';
import { EVENT_TAGS } from '@/constants/screens';
import { EVENT_MEET_VISIBILITY } from '@/constants/events';
import { useAuth } from '@/hooks/useSession';
import { createEventWithThread } from '@/services/eventService';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles } from '@/theme';

export default function CreateEventScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId, profile } = useAuth();
  const { visibility_scope: visibilityScopeParam } = useLocalSearchParams<{
    visibility_scope?: string;
  }>();
  const styles = useThemedStyles((t) => ({
    content: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl },
  }));
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [cityError, setCityError] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [startsAtError, setStartsAtError] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [capacityError, setCapacityError] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibilityScope, setVisibilityScope] = useState<'all_verified' | 'friends'>(
    EVENT_MEET_VISIBILITY.public,
  );

  useEffect(() => {
    if (visibilityScopeParam === 'friends' || visibilityScopeParam === 'all_verified') {
      setVisibilityScope(visibilityScopeParam);
    }
  }, [visibilityScopeParam]);

  const onSubmit = async () => {
    if (!userId) return;
    if (!startDate || !startTime) {
      setStartsAtError(t('events.selectDateTimeError'));
      return;
    }
    const startsAt = combineDateAndTime(startDate, startTime);
    if (startsAt.getTime() < Date.now()) {
      setStartsAtError(t('events.selectDateTimeError'));
      return;
    }
    if (!city.trim()) {
      setCityError(t('events.selectCityError'));
      return;
    }
    if (capacity < 1) {
      setCapacityError(t('events.capacityError'));
      return;
    }
    setStartsAtError('');
    setCityError('');
    setCapacityError('');
    setLoading(true);
    try {
      const event = await createEventWithThread(
        client,
        {
          title: title.trim(),
          city: city.trim(),
          venue_name: venueName.trim() || null,
          venue_address: venueAddress.trim() || null,
          description: description.trim(),
          starts_at: startsAt.toISOString(),
          tags,
          languages: ['en'],
          visibility_scope: visibilityScope,
          capacity,
        },
        userId,
        profile?.airline_id,
      );
      if (event?.id) router.replace(SCREENS.events.detail(event.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Title>{t('events.create')}</Title>

        <FormSection isFirst>
          <DateTimeField
            dateLabel={t('events.selectDate')}
            timeLabel={t('events.selectTime')}
            date={startDate}
            time={startTime}
            onDateChange={(date) => {
              setStartDate(date);
              setStartsAtError('');
            }}
            onTimeChange={(time) => {
              setStartTime(time);
              setStartsAtError('');
            }}
            datePlaceholder={t('events.selectDate')}
            timePlaceholder={t('events.selectTime')}
            minimumDate={new Date()}
            error={startsAtError || undefined}
          />
          <CityPickerField
            label={t('events.selectCity')}
            value={city}
            onChange={(nextCity) => {
              setCity(nextCity);
              setCityError('');
            }}
            error={cityError || undefined}
          />
          <Input
            label={t('events.venue')}
            value={venueName}
            onChangeText={setVenueName}
            placeholder={t('events.venuePlaceholder')}
          />
          <Input
            label={t('events.venueAddress')}
            value={venueAddress}
            onChangeText={setVenueAddress}
            placeholder={t('events.venueAddressPlaceholder')}
          />
        </FormSection>

        <FormSection>
          <PillSelectorGroup
            label={t('events.visibility')}
            options={[
              { value: EVENT_MEET_VISIBILITY.public, label: t('events.publicMeet') },
              { value: EVENT_MEET_VISIBILITY.private, label: t('events.privateMeet') },
            ]}
            value={visibilityScope}
            onChange={setVisibilityScope}
          />
          <NumberStepperField
            label={t('events.capacity')}
            value={capacity}
            onChange={(next) => {
              setCapacity(next);
              setCapacityError('');
            }}
            min={1}
            max={999}
            error={capacityError || undefined}
          />
        </FormSection>

        <FormSection>
          <Input
            label={t('events.meetTitle')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('events.meetTitlePlaceholder')}
          />
          <Input
            label={t('events.notes')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('events.notesPlaceholder')}
            multiline
          />
          <TagInputField
            label={t('events.tags')}
            tags={tags}
            onChangeTags={setTags}
            suggestions={EVENT_TAGS}
            placeholder={t('events.tagsPlaceholder')}
            quickTagsLabel={t('events.quickTags')}
          />
        </FormSection>

        <Button label={t('common.save')} onPress={onSubmit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
