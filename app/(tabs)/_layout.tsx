import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/ui';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.bgCanvas,
          borderTopColor: theme.colors.hairline,
        },
        headerStyle: { backgroundColor: theme.colors.bgCanvas },
        headerTitleStyle: {
          ...theme.typography.headline,
          color: theme.colors.textPrimary,
        },
        headerTintColor: theme.colors.accent,
        sceneStyle: { backgroundColor: theme.colors.bgCanvas },
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <AppIcon name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: t('tabs.network'),
          tabBarLabel: t('tabs.network'),
          tabBarIcon: ({ color, size }) => <AppIcon name="network" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t('tabs.events'),
          tabBarLabel: t('tabs.events'),
          tabBarIcon: ({ color, size }) => <AppIcon name="events" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarLabel: t('tabs.messages'),
          tabBarIcon: ({ color, size }) => <AppIcon name="messages" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('tabs.friends'),
          tabBarLabel: t('tabs.friends'),
          tabBarIcon: ({ color, size }) => <AppIcon name="friends" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
