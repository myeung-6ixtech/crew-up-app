import '@/lib/i18n';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AppSplash } from '@/components/AppSplash';
import { AppProviders } from '@/contexts/AppProviders';
import { GuidelinesGateSheet } from '@/features/legal/guidelinesGate';
import { useOnboardingState } from '@/features/onboarding/hooks/useOnboardingState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSession } from '@/hooks/useSession';
import { fontAssets } from '@/theme';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { loading, session } = useSession();
  const theme = useTheme();
  const { status } = useOnboardingState();
  useAuthGuard();
  // Signed in: stay on the splash until the guard knows where to send them, so Home never flashes first.
  const routing = Boolean(session?.user?.id) && (status === 'idle' || status === 'loading');

  useEffect(() => {
    if (!loading) {
      void SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) return <AppSplash />;

  return (
    <>
    <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: theme.colors.bgCanvas },
        headerTitleStyle: {
          ...theme.typography.headline,
          color: theme.colors.textPrimary,
        },
        headerTintColor: theme.colors.accentText,
        contentStyle: { backgroundColor: theme.colors.bgCanvas },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="auth/sign-up-password" options={{ headerShown: false }} />
      <Stack.Screen name="auth/check-inbox" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="auth/verified" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="auth/reset" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="roster/upload" options={{ headerShown: false }} />
      <Stack.Screen name="roster/confirm" options={{ headerShown: false }} />
      <Stack.Screen name="roster/manage" options={{ title: 'My schedule' }} />
      <Stack.Screen name="trips/index" options={{ headerShown: false }} />
      <Stack.Screen name="roster/add-trip" options={{ headerShown: false }} />
      <Stack.Screen name="presence/[city]" options={{ title: 'Who is around' }} />
      <Stack.Screen name="network/connections" options={{ title: 'Connections' }} />
      <Stack.Screen name="network/discover" options={{ title: 'Discover' }} />
      <Stack.Screen name="network/[userId]" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="events/create" options={{ headerShown: false }} />
      <Stack.Screen name="events/edit/[id]" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="events/attendees/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="messages/[threadId]" options={{ headerShown: false }} />
      <Stack.Screen name="friends/add" options={{ headerShown: false }} />
      <Stack.Screen name="discover/search" options={{ headerShown: false }} />
      <Stack.Screen name="discover/layover/[tripId]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit-section/[step]" options={{ title: '' }} />
      <Stack.Screen name="profile/privacy" options={{ headerShown: false }} />
      <Stack.Screen name="profile/settings/language" options={{ headerShown: false }} />
      <Stack.Screen name="profile/settings/account-security" options={{ headerShown: false }} />
      <Stack.Screen name="profile/settings/blocked" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ headerShown: false }} />
      <Stack.Screen name="settings/account" options={{ headerShown: false }} />
      <Stack.Screen name="settings/appearance" options={{ headerShown: false }} />
      <Stack.Screen name="settings/about" options={{ headerShown: false }} />
      <Stack.Screen name="account/delete" options={{ headerShown: false }} />
      <Stack.Screen name="legal/guidelines" options={{ headerShown: false }} />
      <Stack.Screen name="legal/licenses" options={{ headerShown: false }} />
      <Stack.Screen name="legal/safety" options={{ headerShown: false }} />
      <Stack.Screen name="account/deletion-pending" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="dev/ui-kit" options={{ title: 'UI Kit' }} />
    </Stack>
    {session?.user?.id ? <GuidelinesGateSheet /> : null}
    {routing ? (
      <View style={StyleSheet.absoluteFill}>
        <AppSplash />
      </View>
    ) : null}
    </>
  );
}

function RootWithFonts() {
  const [fontsLoaded] = useFonts(fontAssets);

  if (!fontsLoaded) return <AppSplash />;

  return <RootNavigator />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <RootWithFonts />
      </AppProviders>
    </SafeAreaProvider>
  );
}
