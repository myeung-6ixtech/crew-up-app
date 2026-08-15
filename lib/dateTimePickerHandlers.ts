import { Platform } from 'react-native';
import type { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';

export function createDatePickerHandlers(
  onSelect: (date: Date) => void,
  onClose: () => void,
) {
  return {
    onValueChange: (_event: DateTimePickerChangeEvent, date: Date) => {
      onSelect(date);
      if (Platform.OS === 'android') {
        onClose();
      }
    },
    onDismiss: onClose,
  };
}
