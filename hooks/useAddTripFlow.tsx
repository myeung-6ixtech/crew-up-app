import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { AddTripMethodOverlay, type AddTripMethod } from '@/components/roster/AddTripMethodOverlay';
import { SCREENS } from '@/constants/screens';

export function useAddTripFlow() {
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);

  const openAddTrip = useCallback(() => {
    setPickerVisible(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const onSelectMethod = useCallback(
    (method: AddTripMethod) => {
      router.push(method === 'search' ? SCREENS.roster.addTrip : SCREENS.roster.upload);
    },
    [router],
  );

  const addTripMethodOverlay = (
    <AddTripMethodOverlay
      visible={pickerVisible}
      onClose={closePicker}
      onSelect={onSelectMethod}
    />
  );

  return {
    openAddTrip,
    addTripMethodOverlay,
  };
}
