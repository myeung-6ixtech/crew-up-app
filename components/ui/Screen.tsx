import { View, type ViewProps } from 'react-native';
import { useThemedStyles } from '@/theme';

export function Screen({ children, style, ...props }: ViewProps) {
  const styles = useThemedStyles((t) => ({
    screen: {
      flex: 1,
      backgroundColor: t.colors.bgCanvas,
      padding: t.spacing.lg,
    },
  }));

  return (
    <View style={[styles.screen, style]} {...props}>
      {children}
    </View>
  );
}
