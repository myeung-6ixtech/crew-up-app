import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSession } from '@/hooks/useSession';
import { isAppleSignInAvailable, signInWithApple } from '@/services/authService';

/** Apple's own button (Guideline 4.8). Renders nothing off iOS or where Sign in with Apple isn't available. */
export function AppleSignInButton({ variant, onError }: { variant: 'white' | 'black'; onError: (message: string) => void }) {
  const { refreshSession } = useSession();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setAvailable);
  }, []);

  if (!available) return null;

  const onPress = async () => {
    if (loading) return;
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
    <View style={{ height: 56, justifyContent: 'center' }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={
          variant === 'white'
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={28}
        style={{ height: 56, width: '100%', opacity: loading ? 0.6 : 1 }}
        onPress={() => void onPress()}
      />
      {loading ? <ActivityIndicator style={{ position: 'absolute', right: 22 }} color={variant === 'white' ? '#000000' : '#FFFFFF'} /> : null}
    </View>
  );
}
