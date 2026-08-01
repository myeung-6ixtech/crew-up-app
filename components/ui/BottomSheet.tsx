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
const SHEET_FLEX_HEIGHT = Dimensions.get('window').height * 0.75;

export function BottomSheet({
  visible,
  onClose,
  children,
  title,
  scrollable = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** When false, children manage their own scroll (e.g. FlatList). */
  scrollable?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(visible);
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSCREEN_Y)).current;

  useEffect(() => {
    if (visible) {
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
      height: SHEET_FLEX_HEIGHT,
      maxHeight: '75%',
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
      ...t.typography.headline,
      color: t.colors.textPrimary,
      marginBottom: t.spacing.md,
    },
  }));

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
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
