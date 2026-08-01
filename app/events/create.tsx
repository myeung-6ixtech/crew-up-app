import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Input, Button, SelectionOption, LabelText } from '@/components/ui';
import { EVENT_TAGS } from '@/constants/screens';
import { useAuth } from '@/hooks/useSession';
import { createEventWithThread } from '@/services/eventService';
import { SCREENS } from '@/constants/screens';
import { useThemedStyles } from '@/theme';

export default function CreateEventScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { userId } = useAuth();
  const styles = useThemedStyles((t) => ({ content: { padding: t.spacing.lg } }));
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  };

  const onSubmit = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const event = await createEventWithThread(
        client,
        {
          title: title.trim(),
          city: city.trim(),
          description: description.trim(),
          starts_at: startsAt,
          tags,
          languages: ['en'],
          visibility_scope: 'all_verified',
          capacity: 20,
        },
        userId,
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
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="City" value={city} onChangeText={setCity} />
        <Input
          label="Starts at (ISO)"
          value={startsAt}
          onChangeText={setStartsAt}
          placeholder="2026-08-01T18:00:00Z"
        />
        <Input label="Description" value={description} onChangeText={setDescription} multiline />
        <LabelText style={{ marginVertical: 8 }}>Tags</LabelText>
        {EVENT_TAGS.map((tag) => (
          <SelectionOption
            key={tag}
            label={tag}
            selected={tags.includes(tag)}
            onPress={() => toggleTag(tag)}
          />
        ))}
        <Button label={t('common.save')} onPress={onSubmit} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
