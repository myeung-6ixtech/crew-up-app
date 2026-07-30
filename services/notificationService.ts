import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import type { ApolloClient } from '@apollo/client';
import {
  GET_NOTIFICATIONS,
  MARK_NOTIFICATION_READ,
  NOTIFICATIONS_SUBSCRIPTION,
} from '@/graphql/subscriptions/notifications';

const PUSH_TOKEN_KEY = 'expoPushToken';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  return token;
}

export async function getStoredPushToken() {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function fetchNotifications(
  client: ApolloClient,
  userId: string,
) {
  const { data } = await client.query({
    query: GET_NOTIFICATIONS,
    variables: { userId },
    fetchPolicy: 'network-only',
  });
  return (data as any)?.notifications ?? [];
}

export async function markNotificationRead(
  client: ApolloClient,
  id: string,
) {
  await client.mutate({
    mutation: MARK_NOTIFICATION_READ,
    variables: { id, readAt: new Date().toISOString() },
  });
}

export { NOTIFICATIONS_SUBSCRIPTION };
