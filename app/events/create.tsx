import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Input, Button, BodyText, DateTimeField, TagInputField } from '@/components/ui';
import { EVENT_TAGS } from '@/constants/screens';
import { EVENT_MEET_VISIBILITY, meetTypeFromVisibilityScope } from '@/constants/events';
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
    content: { padding: t.spacing.lg },
    meetTypeHint: { marginBottom: t.spacing.md },
  }));
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [startsAtError, setStartsAtError] = useState('');
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

  const meetType = meetTypeFromVisibilityScope(visibilityScope);

  const onSubmit = async () => {
    if (!userId) return;
    if (!startsAt) {
      setStartsAtError(t('events.selectDateTimeError'));
      return;
    }
    setStartsAtError('');
    setLoading(true);
    try {
      const event = await createEventWithThread(
        client,
        {
          title: title.trim(),
          city: city.trim(),
          description: description.trim(),
          starts_at: startsAt.toISOString(),
          tags,
          languages: ['en'],
          visibility_scope: visibilityScope,
          capacity: 20,
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
      <ScrollView contentContainerStyle={styles.content}>
        <Title>{t('events.create')}</Title>
        <BodyText muted style={styles.meetTypeHint}>
          {meetType === 'private' ? t('events.privateMeetBody') : t('events.publicMeetBody')}
        </BodyText>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="City" value={city} onChangeText={setCity} />
        <DateTimeField
          label={t('events.selectDateTime')}
          value={startsAt}
          onChange={(date) => {
            setStartsAt(date);
            setStartsAtError('');
          }}
          placeholder={t('events.selectDateTime')}
          minimumDate={new Date()}
          error={startsAtError || undefined}
        />
        <Input label="Description" value={description} onChangeText={setDescription} multiline />
        <TagInputField
          label={t('events.tags')}
          tags={tags}
          onChangeTags={setTags}
          suggestions={EVENT_TAGS}
          placeholder={t('events.tagsPlaceholder')}
          quickTagsLabel={t('events.quickTags')}
        />
        <Button label={t('common.save')} onPress={onSubmit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
