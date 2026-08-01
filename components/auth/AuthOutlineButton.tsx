import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, useTheme } from '@/theme';

export function AuthOutlineButton({
  label,
  onPress,
  loading,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      borderRadius: t.radius.cta,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      backgroundColor: t.colors.bgSurfaceRaised,
      marginTop: t.spacing.sm,
      paddingHorizontal: t.spacing.lg,
      ...t.shadow.card,
    },
    icon: { marginRight: 10 },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
  }));

  return (
    <Pressable onPress={onPress} disabled={loading} style={styles.button}>
      {loading ? (
        <ActivityIndicator color={theme.colors.accent} />
      ) : (
        <>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
