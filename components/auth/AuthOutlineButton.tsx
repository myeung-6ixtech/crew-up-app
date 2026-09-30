import { ActivityIndicator, Pressable, Text, View, type TextStyle } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { useThemedStyles, useTheme } from '@/theme';

export function AuthOutlineButton({
  label,
  onPress,
  loading,
  icon,
  labelStyle,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
  labelStyle?: TextStyle;
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
      paddingHorizontal: t.spacing.lg,
      ...t.shadow.card,
    },
    icon: { marginRight: 10 },
    label: { ...t.typography.button, color: t.colors.textPrimary },
  }));

  return (
    <Pressable
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      disabled={loading}
      style={styles.button}>
      {loading ? (
        <ActivityIndicator color={theme.colors.accentText} />
      ) : (
        <>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
