import { Pressable, View, Text } from 'react-native';
import { useThemedStyles } from '@/theme';
import { Avatar } from './Avatar';

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  avatarName,
  inset = true,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  avatarName?: string;
  /** When false, omits horizontal padding (for use inside pre-padded containers). */
  inset?: boolean;
}) {
  const styles = useThemedStyles((t) => ({
    row: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: t.spacing.sm,
      paddingHorizontal: inset ? t.spacing.lg : 0,
      gap: t.spacing.md,
    },
    content: { flex: 1 },
    title: { ...t.typography.bodyStrong, color: t.colors.textPrimary },
    subtitle: { ...t.typography.caption, color: t.colors.textSecondary, marginTop: 2 },
    right: { alignItems: 'flex-end' },
    divider: {
      height: 1,
      backgroundColor: t.colors.hairline,
      marginLeft: inset ? t.spacing.lg + 32 + t.spacing.md : 32 + t.spacing.md,
    },
  }));

  const inner = (
    <View style={styles.row}>
      {avatarName ? <Avatar name={avatarName} size="sm" /> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {inner}
        <View style={styles.divider} />
      </Pressable>
    );
  }

  return (
    <>
      {inner}
      <View style={styles.divider} />
    </>
  );
}
