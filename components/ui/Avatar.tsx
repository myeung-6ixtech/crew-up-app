import { View, Text } from 'react-native';
import { useThemedStyles } from '@/theme';

const sizes = { sm: 32, md: 48, lg: 72, xl: 96 } as const;

export function Avatar({
  name,
  size = 'md',
}: {
  name?: string;
  size?: keyof typeof sizes;
}) {
  const dim = sizes[size];
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  const styles = useThemedStyles((t) => ({
    avatar: {
      width: dim,
      height: dim,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontFamily: t.typography.bodyStrong.fontFamily,
      fontSize: dim * 0.38,
      color: t.colors.accent,
      fontWeight: '700',
    },
  }));

  return (
    <View style={styles.avatar}>
      <Text style={styles.text}>{initial}</Text>
    </View>
  );
}
