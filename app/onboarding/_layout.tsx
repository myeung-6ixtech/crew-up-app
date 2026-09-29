import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function OnboardingLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: theme.colors.bgCanvas },
      }}>
      <Stack.Screen
        name="roster-intro"
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: '',
          headerStyle: { backgroundColor: theme.colors.bgCanvas },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
