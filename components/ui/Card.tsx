import { View, type ViewProps } from 'react-native';
import { useThemedStyles } from '@/theme';

export function Card({ children, style, ...props }: ViewProps) {
  const styles = useThemedStyles((t) => ({
    card: {
      backgroundColor: t.colors.bgSurfaceRaised,
      borderRadius: t.radius.card,
      padding: t.spacing.lg,
      marginBottom: t.spacing.md,
      ...t.shadow.card,
    },
  }));

  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}
