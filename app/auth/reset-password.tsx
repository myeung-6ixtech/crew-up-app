import { useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Input, Button } from '@/components/ui';
import { resetPassword } from '@/services/authService';
import { SCREENS } from '@/constants/screens';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ ticket?: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!params.ticket) {
      setError('Missing reset ticket. Open the link from your email.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(password, params.ticket);
      router.replace(SCREENS.auth.login);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>Reset password</Title>
      <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={{ color: '#DC2626' }}>{error}</Text> : null}
      <Button label="Update password" onPress={onSubmit} loading={loading} />
    </Screen>
  );
}
