import '@/lib/i18n';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '@/contexts/AppProviders';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSession } from '@/hooks/useSession';
import { colors } from '@/components/ui';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { loading } = useSession();
  useAuthGuard();

  useEffect(() => {
    if (!loading) {
      void SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ title: 'Sign in', headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ title: 'Register', headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ title: 'Forgot password' }} />
      <Stack.Screen name="auth/reset-password" options={{ title: 'Reset password' }} />
      <Stack.Screen name="onboarding/index" options={{ title: 'Profile setup' }} />
      <Stack.Screen name="onboarding/verification" options={{ title: 'Verification' }} />
      <Stack.Screen name="onboarding/roster-intro" options={{ title: 'Your schedule' }} />
      <Stack.Screen name="roster/upload" options={{ title: 'Upload roster' }} />
      <Stack.Screen name="roster/confirm" options={{ title: 'Confirm layovers' }} />
      <Stack.Screen name="roster/manage" options={{ title: 'My schedule' }} />
      <Stack.Screen name="presence/[city]" options={{ title: 'Who is around' }} />
      <Stack.Screen name="network/connections" options={{ title: 'Connections' }} />
      <Stack.Screen name="network/discover" options={{ title: 'Discover' }} />
      <Stack.Screen name="network/[userId]" options={{ title: 'Crew profile' }} />
      <Stack.Screen name="events/[id]" options={{ title: 'Event' }} />
      <Stack.Screen name="events/create" options={{ title: 'Create meetup' }} />
      <Stack.Screen name="events/edit/[id]" options={{ title: 'Edit event' }} />
      <Stack.Screen name="messages/[threadId]" options={{ title: 'Chat' }} />
      <Stack.Screen name="profile/edit" options={{ title: 'Edit profile' }} />
      <Stack.Screen name="profile/privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="profile/safety-center" options={{ title: 'Safety Center' }} />
      <Stack.Screen name="profile/verification-status" options={{ title: 'Verification' }} />
      <Stack.Screen name="profile/settings/language" options={{ title: 'Language' }} />
      <Stack.Screen name="profile/settings/account-security" options={{ title: 'Account security' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
