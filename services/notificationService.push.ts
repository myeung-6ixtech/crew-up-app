import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const EAS_PROJECT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getEasProjectId(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (fromEnv && EAS_PROJECT_ID_RE.test(fromEnv)) return fromEnv;

  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromConfig === 'string' && EAS_PROJECT_ID_RE.test(fromConfig)) {
    return fromConfig;
  }

  return null;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsImpl(storageKey: string) {
  const projectId = getEasProjectId();
  if (!projectId) {
    if (__DEV__) {
      console.warn(
        '[notifications] Skipping push token: no valid EAS project UUID. Run `eas init`, then set EXPO_PUBLIC_EAS_PROJECT_ID.',
      );
    }
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await SecureStore.setItemAsync(storageKey, token);
    return token;
  } catch (error) {
    if (__DEV__) {
      console.warn('[notifications] Push token registration failed:', error);
    }
    return null;
  }
}
