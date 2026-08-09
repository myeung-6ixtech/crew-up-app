import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, AppIcon } from '@/components/ui';
import { useAppMenu } from '@/contexts/AppMenuContext';
import { SCREENS } from '@/constants/screens';
import { useAuth, useSession } from '@/hooks/useSession';
import { useThemedStyles, useTheme } from '@/theme';

const PANEL_WIDTH_RATIO = 0.75;

const slideEasing = {
  in: Easing.bezier(0.4, 0, 1, 1),
  out: Easing.bezier(0, 0, 0.2, 1),
} as const;

type MenuItem = {
  id: string;
  label: string;
  icon: 'edit' | 'privacy' | 'shield' | 'globe' | 'settings';
  route: Href;
};

export function AppSideMenu() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const panelWidth = Math.round(screenWidth * PANEL_WIDTH_RATIO);
  const { isOpen, close } = useAppMenu();
  const { profile } = useAuth();
  const { signOut } = useSession();

  const [modalVisible, setModalVisible] = useState(isOpen);
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      panelTranslateX.setValue(-panelWidth);
      scrimOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 1,
          duration: theme.motion.slow,
          easing: slideEasing.out,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslateX, {
          toValue: 0,
          duration: theme.motion.slow,
          easing: slideEasing.out,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 0,
          duration: theme.motion.base,
          easing: slideEasing.in,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslateX, {
          toValue: -panelWidth,
          duration: theme.motion.base,
          easing: slideEasing.in,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setModalVisible(false);
      });
    }
  }, [
    isOpen,
    panelTranslateX,
    panelWidth,
    scrimOpacity,
    theme.motion.base,
    theme.motion.slow,
  ]);

  const styles = useThemedStyles((t) => ({
    root: { flex: 1 },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.colors.scrim,
    },
    panel: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: panelWidth,
      flexDirection: 'column',
      backgroundColor: t.colors.bgSurfaceRaised,
      borderTopRightRadius: t.radius.card,
      borderBottomRightRadius: t.radius.card,
      paddingTop: insets.top + t.spacing.md,
      paddingBottom: Math.max(insets.bottom, t.spacing.lg),
      ...t.shadow.raised,
    },
    profileBlock: {
      alignItems: 'center',
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.hairline,
      marginBottom: t.spacing.sm,
    },
    profileName: {
      ...t.typography.bodyStrong,
      color: t.colors.textPrimary,
      marginTop: t.spacing.sm,
      textAlign: 'center',
    },
    menuItem: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
    },
    menuLabel: {
      ...t.typography.body,
      color: t.colors.textPrimary,
      flex: 1,
    },
    menuLabelDestructive: {
      color: t.colors.statusOnDuty,
    },
    menuScroll: {
      flex: 1,
    },
    footer: {
      marginTop: 'auto' as const,
      borderTopWidth: 1,
      borderTopColor: t.colors.hairline,
      paddingTop: t.spacing.sm,
    },
  }));

  const menuItems: MenuItem[] = [
    { id: 'edit', label: t('home.editProfile'), icon: 'edit', route: SCREENS.profile.edit },
    { id: 'privacy', label: t('menu.privacy'), icon: 'privacy', route: SCREENS.profile.privacy },
    { id: 'safety', label: t('menu.safety'), icon: 'shield', route: SCREENS.profile.safety },
    { id: 'language', label: t('menu.language'), icon: 'globe', route: SCREENS.profile.language },
    {
      id: 'security',
      label: t('menu.accountSecurity'),
      icon: 'settings',
      route: SCREENS.profile.security,
    },
  ];

  const navigate = (route: Href) => {
    close();
    router.push(route);
  };

  const confirmSignOut = () => {
    Alert.alert(t('menu.signOutTitle'), t('menu.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: () => {
          close();
          void signOut();
        },
      },
    ]);
  };

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={close}>
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityLabel={t('common.dismiss')}
          />
        </Animated.View>

        <Animated.View style={[styles.panel, { transform: [{ translateX: panelTranslateX }] }]}>
          <View style={styles.profileBlock}>
            <Avatar name={profile?.display_name} fileId={profile?.avatar_file_id} size="lg" />
            <Text style={styles.profileName}>
              {profile?.display_name ?? t('home.yourProfile')}
            </Text>
          </View>

          <ScrollView
            style={styles.menuScroll}
            bounces={false}
            showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => navigate(item.route)}
                style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.72 : 1 }]}>
                <AppIcon name={item.icon} size={22} color={theme.colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <AppIcon name="chevronRight" size={18} color={theme.colors.textTertiary} />
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('auth.signOut')}
              onPress={confirmSignOut}
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.72 : 1 }]}>
              <AppIcon name="signOut" size={22} color={theme.colors.statusOnDuty} />
              <Text style={[styles.menuLabel, styles.menuLabelDestructive]}>
                {t('auth.signOut')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
