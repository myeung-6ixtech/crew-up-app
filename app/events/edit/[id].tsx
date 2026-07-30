import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Input, Button } from '@/components/ui';
import { fetchEvent, updateEvent } from '@/services/eventService';
import { SCREENS } from '@/constants/screens';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const event = await fetchEvent(client, id);
    if (event) {
      setTitle(event.title);
      setCity(event.city);
      setDescription(event.description ?? '');
    }
  }, [client, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await updateEvent(client, id, {
        title: title.trim(),
        city: city.trim(),
        description: description.trim(),
      });
      router.replace(SCREENS.events.detail(id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>Edit event</Title>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="City" value={city} onChangeText={setCity} />
        <Input label="Description" value={description} onChangeText={setDescription} multiline />
        <Button label={t('common.save')} onPress={onSave} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
