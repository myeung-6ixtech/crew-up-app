import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/hooks/useSession';
import { hapticImpact } from '@/lib/haptics';
import { isAppleSignInAvailable, signInWithApple } from '@/services/authService';
import { fontFamily } from '@/theme';

/**
 * Continue with Apple (Guideline 4.8). A custom button so its title matches Continue with Google (Jakarta Bold 16):
 * Apple's native button sizes its font from the button height. It keeps what the HIG requires of custom buttons —
 * the Apple logo, an approved title, and black or white styling. Renders nothing where Sign in with Apple isn't available.
 */
export function AppleSignInButton({ variant, onError }: { variant: 'white' | 'black'; onError: (message: string) => void }) {
  const { t } = useTranslation();
  const { refreshSession } = useSession();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAvailable);
  }, []);

  if (!available) return null;

  const fg = variant === 'white' ? '#000000' : '#FFFFFF';
  const bg = variant === 'white' ? '#FFFFFF' : '#000000';

  const onPress = async () => {
    if (loading) return;
    hapticImpact();
    setLoading(true);
    try {
      await signInWithApple();
      await refreshSession();
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (!message.toLowerCase().includes('cancel')) onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('auth.continueWithApple')}
      accessibilityState={{ busy: loading }}
      disabled={loading}
      onPress={() => void onPress()}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 28,
        backgroundColor: bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: loading ? 0.6 : pressed ? 0.85 : 1,
      })}>
      <View style={{ marginTop: -3 }}>
        <SymbolView name="applelogo" tintColor={fg} size={18} weight="semibold" resizeMode="scaleAspectFit" style={{ width: 18, height: 20 }} />
      </View>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: fg }}>{t('auth.continueWithApple')}</Text>
      {loading ? <ActivityIndicator style={{ position: 'absolute', right: 22 }} color={fg} /> : null}
    </Pressable>
  );
}
