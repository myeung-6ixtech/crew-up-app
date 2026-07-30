import { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Input, Button } from '@/components/ui';
import { signIn } from '@/services/authService';
import { useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshSession } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      await refreshSession();
      router.replace(SCREENS.tabs.home);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>{t('auth.login')}</Title>
      <Input label={t('auth.email')} value={email} onChangeText={setEmail} placeholder="you@airline.com" />
      <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={{ color: '#DC2626', marginBottom: 8 }}>{error}</Text> : null}
      <Button label={t('auth.login')} onPress={onSubmit} loading={loading} />
      <Link href={SCREENS.auth.forgotPassword} asChild>
        <Pressable style={{ marginTop: 16 }}>
          <Text style={{ color: '#0B5FFF' }}>{t('auth.forgotPassword')}</Text>
        </Pressable>
      </Link>
      <Link href={SCREENS.auth.register} asChild>
        <Pressable style={{ marginTop: 8 }}>
          <Text style={{ color: '#0B5FFF' }}>{t('auth.register')}</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
