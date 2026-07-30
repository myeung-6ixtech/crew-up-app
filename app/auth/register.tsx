import { useState } from 'react';
import { Text, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Input, Button } from '@/components/ui';
import { signUp } from '@/services/authService';
import { useSession } from '@/hooks/useSession';
import { SCREENS } from '@/constants/screens';

export default function RegisterScreen() {
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
      await signUp(email.trim(), password);
      await refreshSession();
      router.replace(SCREENS.onboarding.index);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>{t('auth.register')}</Title>
      <Input label={t('auth.email')} value={email} onChangeText={setEmail} placeholder="you@airline.com" />
      <Input label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={{ color: '#DC2626', marginBottom: 8 }}>{error}</Text> : null}
      <Button label={t('auth.register')} onPress={onSubmit} loading={loading} />
      <Link href={SCREENS.auth.login} asChild>
        <Pressable style={{ marginTop: 16 }}>
          <Text style={{ color: '#0B5FFF' }}>{t('auth.login')}</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}
