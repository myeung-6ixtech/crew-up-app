import type { ApolloClient } from '@apollo/client';
import {
  GET_NOTIFICATIONS,
  MARK_NOTIFICATION_READ,
  NOTIFICATIONS_SUBSCRIPTION,
} from '@/graphql/subscriptions/notifications';
import { pushNotificationsEnabled } from '@/lib/pushNotificationsEnabled';

const PUSH_TOKEN_KEY = 'expoPushToken';

export async function registerForPushNotifications() {
  if (!pushNotificationsEnabled) return null;

  const { registerForPushNotificationsImpl } = await import('./notificationService.push');
  return registerForPushNotificationsImpl(PUSH_TOKEN_KEY);
}

export async function getStoredPushToken() {
  if (!pushNotificationsEnabled) return null;

  const SecureStore = await import('expo-secure-store');
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
