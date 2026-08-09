import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { EventMeetTypeOverlay } from '@/components/events/EventMeetTypeOverlay';
import { EVENT_MEET_VISIBILITY, type EventMeetType } from '@/constants/events';
import { SCREENS } from '@/constants/screens';

export function useCreateEventFlow() {
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);

  const openCreateEvent = useCallback(() => {
    setPickerVisible(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const onSelectMeetType = useCallback(
    (type: EventMeetType) => {
      router.push({
        pathname: SCREENS.events.create,
        params: { visibility_scope: EVENT_MEET_VISIBILITY[type] },
      });
    },
    [router],
  );

  const meetTypeOverlay = (
    <EventMeetTypeOverlay
      visible={pickerVisible}
      onClose={closePicker}
      onSelect={onSelectMeetType}
    />
  );

  return {
    openCreateEvent,
    meetTypeOverlay,
  };
}
