import { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Input, Button } from '@/components/ui';
import { changePassword } from '@/services/authService';

export default function AccountSecurityScreen() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await changePassword(password);
      setMessage('Password updated.');
      setPassword('');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>Account security</Title>
      <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      {message ? <Text style={{ marginBottom: 8 }}>{message}</Text> : null}
      <Button label="Change password" onPress={onSubmit} loading={loading} />
    </Screen>
  );
}
