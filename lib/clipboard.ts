import { Platform, Share } from 'react-native';

export async function copyToClipboard(text: string): Promise<void> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  await Share.share({ message: text });
}
