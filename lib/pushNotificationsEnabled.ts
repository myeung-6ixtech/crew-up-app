/** Expo push is off until EAS is configured. Set EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true to re-enable. */
export const pushNotificationsEnabled =
  process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true';
