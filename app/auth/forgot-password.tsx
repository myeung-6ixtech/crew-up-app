import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Subtitle, Input, Button } from '@/components/ui';
import { sendPasswordResetEmail } from '@/services/authService';
import { SCREENS } from '@/constants/screens';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(email.trim());
      setMessage('Check your email for a reset link.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>{t('auth.forgotPassword')}</Title>
      <Subtitle>We will email you a link to reset your password.</Subtitle>
      <Input label={t('auth.email')} value={email} onChangeText={setEmail} />
      {message ? <Text style={{ marginBottom: 8 }}>{message}</Text> : null}
      <Button label="Send reset link" onPress={onSubmit} loading={loading} />
      <Button label={t('common.cancel')} onPress={() => router.back()} variant="secondary" />
    </Screen>
  );
}
