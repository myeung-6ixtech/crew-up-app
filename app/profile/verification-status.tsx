import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Title, Subtitle, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useSession';

export default function VerificationStatusScreen() {
  const { t } = useTranslation();
  const { isVerified } = useAuth();

  return (
    <Screen>
      <Title>Verification status</Title>
      {isVerified ? (
        <>
          <Badge label={t('verification.verified')} tone="success" />
          <Subtitle>Your crew credentials are verified.</Subtitle>
        </>
      ) : (
        <>
          <Badge label={t('verification.pending')} />
          <Subtitle>{t('verification.pendingBody')}</Subtitle>
          <Text>Upload your crew ID from onboarding if you have not already.</Text>
        </>
      )}
    </Screen>
  );
}
