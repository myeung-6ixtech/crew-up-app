import { View, Text, Image } from 'react-native';
import { useThemedStyles } from '@/theme';
import { useStorageFileUri } from '@/hooks/useStorageFileUri';

const sizes = { sm: 32, md: 48, lg: 72, xl: 96 } as const;

export function Avatar({
  name,
  fileId,
  localUri,
  size = 'md',
}: {
  name?: string;
  /** Nhost storage file id from profile.avatar_file_id */
  fileId?: string | null;
  /** Local file URI shown immediately after pick (before remote URL resolves). */
  localUri?: string | null;
  size?: keyof typeof sizes;
}) {
  const dim = sizes[size];
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  const { uri: remoteUri, headers } = useStorageFileUri(fileId);
  const imageUri = localUri ?? remoteUri;
  const initialVariant =
    size === 'xl' ? 'display' : size === 'lg' ? 'displaySm' : size === 'md' ? 'numericLg' : 'bodySm';

  const styles = useThemedStyles((t) => ({
    avatar: {
      width: dim,
      height: dim,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: {
      width: dim,
      height: dim,
    },
    text: {
      ...t.typography[initialVariant],
      color: t.colors.accent,
    },
  }));

  if (imageUri) {
    return (
      <View style={styles.avatar}>
        <Image
          source={headers ? { uri: imageUri, headers } : { uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={name ? `${name} avatar` : 'Avatar'}
        />
      </View>
    );
  }

  return (
    <View style={styles.avatar}>
      <Text style={styles.text}>{initial}</Text>
    </View>
  );
}
