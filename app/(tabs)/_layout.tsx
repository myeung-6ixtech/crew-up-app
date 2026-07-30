import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@/components/ui';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: true,
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarLabel: t('tabs.home') }} />
      <Tabs.Screen name="network" options={{ title: t('tabs.network'), tabBarLabel: t('tabs.network') }} />
      <Tabs.Screen name="events" options={{ title: t('tabs.events'), tabBarLabel: t('tabs.events') }} />
      <Tabs.Screen name="messages" options={{ title: t('tabs.messages'), tabBarLabel: t('tabs.messages') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarLabel: t('tabs.profile') }} />
    </Tabs>
  );
}
