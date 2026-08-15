import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function AddTripLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerStyle: { backgroundColor: theme.colors.bgCanvas },
        headerTitleStyle: {
          ...theme.typography.headline,
          color: theme.colors.textPrimary,
        },
        headerTintColor: theme.colors.accent,
        contentStyle: { backgroundColor: theme.colors.bgCanvas },
      }}>
      <Stack.Screen name="index" options={{ title: 'Add trip' }} />
      <Stack.Screen name="flights" options={{ title: 'Select flight' }} />
    </Stack>
  );
}
