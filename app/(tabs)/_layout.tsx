import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppSideMenu } from '@/components/navigation/AppSideMenu';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { HomeProfileHeaderButton } from '@/components/navigation/HomeProfileHeaderButton';
import { EventsCreateHeaderButton } from '@/components/navigation/EventsCreateHeaderButton';
import { TabHeaderMenuButton } from '@/components/navigation/TabHeaderMenuButton';
import { AppMenuProvider } from '@/contexts/AppMenuContext';
import { TabBarScrollProvider } from '@/contexts/TabBarScrollContext';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <AppMenuProvider>
      <TabBarScrollProvider>
        <Tabs
          tabBar={(props) => <FloatingTabBar {...props} />}
          screenOptions={{
            headerShown: true,
            headerTitle: '',
            headerLeft: () => <TabHeaderMenuButton />,
            tabBarShowLabel: false,
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              height: 0,
            },
            headerStyle: { backgroundColor: theme.colors.bgCanvas },
            headerShadowVisible: false,
            headerTitleStyle: {
              ...theme.typography.headline,
              color: theme.colors.textPrimary,
            },
            headerTintColor: theme.colors.accent,
            sceneStyle: { backgroundColor: theme.colors.bgCanvas },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              tabBarAccessibilityLabel: t('tabs.home'),
              headerRight: () => <HomeProfileHeaderButton />,
            }}
          />
          <Tabs.Screen
            name="network"
            options={{
              tabBarAccessibilityLabel: t('tabs.network'),
            }}
          />
          <Tabs.Screen
            name="events"
            options={{
              tabBarAccessibilityLabel: t('tabs.events'),
              headerRight: () => <EventsCreateHeaderButton />,
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              tabBarAccessibilityLabel: t('tabs.messages'),
            }}
          />
          <Tabs.Screen
            name="friends"
            options={{
              tabBarAccessibilityLabel: t('tabs.friends'),
            }}
          />
        </Tabs>
        <AppSideMenu />
      </TabBarScrollProvider>
    </AppMenuProvider>
  );
}
