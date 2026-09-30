import { Text, View } from 'react-native';
import { useThemedStyles } from '@/theme';

/** Small lime tags for languages, activities, and interests on a profile. */
export function ProfilePills({ names }: { names: string[] }) {
  const styles = useThemedStyles((th) => ({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: th.spacing.xs },
    pill: {
      paddingHorizontal: th.spacing.sm,
      paddingVertical: 4,
      borderRadius: th.radius.pill,
      backgroundColor: th.colors.fill,
    },
    text: { ...th.typography.caption, color: th.colors.onFill },
  }));

  if (!names.length) return null;
  return (
    <View style={styles.row}>
      {names.map((name) => (
        <View key={name} style={styles.pill}>
          <Text style={styles.text}>{name}</Text>
        </View>
      ))}
    </View>
  );
}
