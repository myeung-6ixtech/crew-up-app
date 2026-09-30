import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** iOS uses the Taptic Engine. Android uses a short vibration. Web does nothing. */
function fire(run: () => Promise<void>) {
  if (Platform.OS === 'web') return;
  void run().catch(() => undefined);
}

/** Tabs, pills, steppers, and other choice changes. */
export function hapticSelection() {
  fire(() => Haptics.selectionAsync());
}

/** Buttons, rows, and controls that open something. */
export function hapticImpact() {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Destructive confirmation, such as sign out. */
export function hapticWarning() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** A save, copy, or upload that succeeded. */
export function hapticSuccess() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** A form, search, or upload that failed. */
export function hapticError() {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
