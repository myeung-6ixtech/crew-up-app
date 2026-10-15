import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthPage, ERROR_RED } from '@/components/auth/authKit';
import { SCREENS } from '@/constants/screens';
import { FilledField, PillCta, StepSubtitle, StepTitle } from '@/features/onboarding/components/kit';
import { EMAIL_PATTERN } from '@/lib/password';
import { authErrorCode, sendPasswordResetEmail } from '@/services/authService';
import { useAuthDraftStore } from '@/stores/authDraftStore';
import { fontFamily } from '@/theme';

/** 4J — the email carries over from log in. 4K follows whether or not the address has an account. */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const draftEmail = useAuthDraftStore((state) => state.email);
  const setEmailDraft = useAuthDraftStore((state) => state.setEmail);
  const [email, setEmail] = useState(params.email ?? draftEmail);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const trimmed = email.trim();
  const valid = EMAIL_PATTERN.test(trimmed);

  const send = async () => {
    if (!valid) return;
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(trimmed);
    } catch (e) {
      // "No such user" must look the same as success; anything else (offline, rate limit) is shown.
      const code = authErrorCode(e);
      if (code !== 'user-not-found' && code !== 'disabled-user') {
        setError(e instanceof Error && e.message ? e.message : t('common.error'));
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    setEmailDraft(trimmed);
    router.replace(SCREENS.auth.checkInbox('reset'));
  };

  return (
    <AuthPage onBack={() => router.back()} footer={<PillCta label={t('auth.sendResetLink')} disabled={!valid} loading={loading} onPress={() => void send()} />}>
      <StepTitle>{t('auth.resetTitle')}</StepTitle>
      <StepSubtitle>{t('auth.resetSubtitle')}</StepSubtitle>
      <View style={{ marginTop: 28 }}>
        <FilledField
          label={t('auth.email')}
          value={email}
          onChangeText={(value) => setEmail(value.replace(/\s/g, ''))}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          autoFocus={!email}
          returnKeyType="send"
          onSubmitEditing={() => void send()}
        />
        {error ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, lineHeight: 19, color: ERROR_RED, paddingLeft: 4 }}>{error}</Text> : null}
      </View>
    </AuthPage>
  );
}
