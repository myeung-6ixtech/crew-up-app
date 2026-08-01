import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/theme';

export function AuthScreenLayout({
  children,
  scroll,
  style,
}: ViewProps & { scroll?: boolean }) {
  const styles = useThemedStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.bgCanvas },
    inner: { flex: 1, padding: t.spacing.lg },
    scroll: { flexGrow: 1, padding: t.spacing.lg },
  }));

  if (scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}
