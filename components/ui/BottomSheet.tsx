import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles, useTheme } from '@/theme';

const SHEET_OFFSCREEN_Y = Dimensions.get('window').height;
const DEFAULT_SHEET_HEIGHT_RATIO = 0.75;

export function BottomSheet({
  visible,
  onClose,
  onDismissed,
  children,
  title,
  scrollable = true,
  heightRatio = DEFAULT_SHEET_HEIGHT_RATIO,
}: {
  visible: boolean;
  onClose: () => void;
  /** Fires after the native modal is gone. Needed before presenting the camera or photo library. */
  onDismissed?: () => void;
  children: React.ReactNode;
  title?: string;
  /** When false, children manage their own scroll (e.g. FlatList). */
  scrollable?: boolean;
  /** Fraction of screen height for non-scrollable sheets (0–1). */
  heightRatio?: number;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const sheetHeight = Dimensions.get('window').height * heightRatio;
  const sheetMaxHeight = `${Math.round(heightRatio * 100)}%`;
  const [modalVisible, setModalVisible] = useState(visible);
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSCREEN_Y)).current;
  const onDismissedRef = useRef(onDismissed);
  const presentedRef = useRef(false);
  const notifiedRef = useRef(false);
  onDismissedRef.current = onDismissed;

  const notifyDismissed = () => {
    if (!presentedRef.current || notifiedRef.current) return;
    notifiedRef.current = true;
    presentedRef.current = false;
    onDismissedRef.current?.();
  };

  useEffect(() => {
    if (visible) {
      presentedRef.current = true;
      notifiedRef.current = false;
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 1,
          duration: theme.motion.base,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: theme.motion.base,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 0,
          duration: theme.motion.fast,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SHEET_OFFSCREEN_Y,
          duration: theme.motion.fast,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setModalVisible(false);
      });
    }
  }, [visible, scrimOpacity, sheetTranslateY, theme.motion.base, theme.motion.fast]);

  useEffect(() => {
    if (visible || modalVisible || !presentedRef.current || notifiedRef.current) return;
    // iOS reports the real dismiss via Modal.onDismiss. This covers Android, and iOS if that callback never arrives.
    const delay = Platform.OS === 'ios' ? 300 : 200;
    const timer = setTimeout(notifyDismissed, delay);
    return () => clearTimeout(timer);
  }, [visible, modalVisible]);

  const styles = useThemedStyles((t) => ({
    root: { flex: 1, justifyContent: 'flex-end' },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: t.colors.scrim,
    },
    sheet: {
      backgroundColor: t.colors.bgSurfaceRaised,
      borderTopLeftRadius: t.radius.sheet,
      borderTopRightRadius: t.radius.sheet,
      maxHeight: '90%',
      ...t.shadow.raised,
    } as ViewStyle,
    sheetFlex: {
      backgroundColor: t.colors.bgSurfaceRaised,
      borderTopLeftRadius: t.radius.sheet,
      borderTopRightRadius: t.radius.sheet,
      height: sheetHeight,
      maxHeight: sheetMaxHeight,
      ...t.shadow.raised,
    } as ViewStyle,
    handle: {
      width: 32,
      height: 4,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.hairline,
      alignSelf: 'center',
      marginTop: t.spacing.sm,
    },
    content: {
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      paddingBottom: Math.max(insets.bottom, t.spacing.lg),
    },
    contentFlex: {
      flex: 1,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      paddingBottom: Math.max(insets.bottom, t.spacing.lg),
    },
    title: {
      ...t.typography.displaySm,
      color: t.colors.textPrimary,
      marginBottom: t.spacing.md,
    },
  }));

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onDismiss={notifyDismissed}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.root}>
          <Animated.View style={[styles.scrim, { opacity: scrimOpacity }]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onClose}
              accessibilityLabel="Dismiss"
            />
          </Animated.View>
          <Animated.View
            style={[
              scrollable ? styles.sheet : styles.sheetFlex,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}>
            <View style={styles.handle} accessibilityElementsHidden />
            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                bounces={false}
                contentContainerStyle={styles.content}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {children}
              </ScrollView>
            ) : (
              <View style={styles.contentFlex}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {children}
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
