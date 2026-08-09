import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { Screen, Title, Input, Button, Card, BodyText } from '@/components/ui';
import { useRosterDraftStore } from '@/stores/rosterDraftStore';
import { insertRosters, mapParsedToRosterInsert } from '@/services/rosterService';
import { SCREENS } from '@/constants/screens';

export default function RosterConfirmScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const { entries, sourceFileId, updateEntry, addEntry, clear } = useRosterDraftStore();
  const [loading, setLoading] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');

  const onSave = async () => {
    setLoading(true);
    try {
      const objects: Record<string, unknown>[] = mapParsedToRosterInsert(entries, sourceFileId);
      if (objects.length === 0 && manualCity && manualStart) {
        objects.push({
          layover_city: manualCity,
          layover_start: manualStart,
          layover_end: manualEnd || manualStart,
          source: 'manual',
        });
      }
      await insertRosters(client, objects);
      clear();
      router.replace(SCREENS.tabs.home);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Title>{t('roster.confirm')}</Title>
        {entries.map((entry, index) => (
          <Card key={index}>
            <BodyText strong>{entry.layoverCity ?? 'City TBD'}</BodyText>
            <Input
              label="City"
              value={entry.layoverCity ?? ''}
              onChangeText={(v) => updateEntry(index, { ...entry, layoverCity: v })}
            />
            <Input
              label="Start (ISO)"
              value={entry.layoverStart ?? ''}
              onChangeText={(v) => updateEntry(index, { ...entry, layoverStart: v })}
            />
            <Input
              label="End (ISO)"
              value={entry.layoverEnd ?? ''}
              onChangeText={(v) => updateEntry(index, { ...entry, layoverEnd: v })}
            />
          </Card>
        ))}
        {entries.length === 0 ? (
          <>
            <Input label="Layover city" value={manualCity} onChangeText={setManualCity} />
            <Input label="Start (ISO date)" value={manualStart} onChangeText={setManualStart} placeholder="2026-08-01T00:00:00Z" />
            <Input label="End (ISO date)" value={manualEnd} onChangeText={setManualEnd} />
            <Button
              label="Add entry"
              variant="secondary"
              onPress={() =>
                addEntry({
                  layoverCity: manualCity,
                  layoverStart: manualStart,
                  layoverEnd: manualEnd || manualStart,
                })
              }
            />
          </>
        ) : null}
        <Button label={t('common.save')} onPress={onSave} loading={loading} />
      </ScrollView>
    </Screen>
  );
}
