import type { ApolloClient } from '@apollo/client';
import { router } from 'expo-router';
import type { NotificationResponse } from 'expo-notifications';
import {
  GET_NOTIFICATIONS,
  MARK_NOTIFICATION_READ,
  NOTIFICATIONS_SUBSCRIPTION,
} from '@/graphql/subscriptions/notifications';
import { pushNotificationsEnabled } from '@/lib/pushNotificationsEnabled';

const PUSH_TOKEN_KEY = 'expoPushToken';

export async function registerForPushNotifications() {
  if (!pushNotificationsEnabled) return null;

  try {
    const { registerForPushNotificationsImpl } = await import('./notificationService.push');
    return await registerForPushNotificationsImpl(PUSH_TOKEN_KEY);
  } catch (error) {
    if (__DEV__) console.warn('[notifications] Push setup failed:', error);
    return null;
  }
}

export async function getStoredPushToken() {
  if (!pushNotificationsEnabled) return null;

  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

/** Drops this device's token before sign-out. A failure still lets sign-out finish. */
export async function unregisterStoredPushToken() {
  if (!pushNotificationsEnabled) return;

  try {
    const SecureStore = await import('expo-secure-store');
    const { callClientFunction } = await import('@/lib/api/functions');
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (!token) return;
    await callClientFunction('push/unregister', { body: { expo_push_token: token } });
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch (error) {
    if (__DEV__) console.warn('[notifications] Unregister failed:', error);
  }
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

/** Opens a message thread or a profile from a push tap. Other payloads are ignored. */
export function openPushNotification(response: NotificationResponse) {
  const url = response.notification.request.content.data?.url;
  if (typeof url !== 'string' || !url.startsWith('crewup://')) return;
  const path = `/${url.slice('crewup://'.length)}`;
  if (path.startsWith('/messages/') || path.startsWith('/network/')) {
    router.push(path as never);
  }
}

export { NOTIFICATIONS_SUBSCRIPTION };
