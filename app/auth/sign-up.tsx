import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthPage, ERROR_RED, FieldStatus, InlineLink } from '@/components/auth/authKit';
import { SCREENS } from '@/constants/screens';
import { FilledField, PillCta, StepSubtitle, StepTitle } from '@/features/onboarding/components/kit';
import { EMAIL_PATTERN } from '@/lib/password';
import { useAuthDraftStore } from '@/stores/authDraftStore';
import { fontFamily, useTheme } from '@/theme';

/**
 * 4A — sign up starts with the email alone. The format is checked as you type. There is no availability lookup
 * (Nhost has no public one), so "taken" comes back from Create account and lands here.
 */
export default function SignUpEmailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const email = useAuthDraftStore((state) => state.email);
  const takenEmail = useAuthDraftStore((state) => state.takenEmail);
  const setEmail = useAuthDraftStore((state) => state.setEmail);

  const trimmed = email.trim();
  const valid = EMAIL_PATTERN.test(trimmed);
  const taken = valid && takenEmail === trimmed.toLowerCase();
  const invalid = trimmed.length > 0 && !valid && /@.*\./.test(trimmed);
  const bad = invalid || taken;

  return (
    <AuthPage
      onBack={() => router.back()}
      footer={
        <>
          <PillCta label={t('common.continue')} disabled={!valid || taken} onPress={() => router.push(SCREENS.auth.signUpPassword)} />
          <View style={{ alignItems: 'center', paddingTop: 4 }}>
            <InlineLink lead={t('auth.alreadyHaveAccount')} label={t('auth.logIn')} onPress={() => router.replace(SCREENS.auth.login(valid ? trimmed : undefined))} />
          </View>
        </>
      }>
      <StepTitle>{t('auth.emailTitle')}</StepTitle>
      <StepSubtitle>{t('auth.emailSubtitle')}</StepSubtitle>
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
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => valid && !taken && router.push(SCREENS.auth.signUpPassword)}
          error={bad ? ' ' : undefined}
          hint={null}
          trailing={<FieldStatus label={taken ? t('auth.taken') : invalid ? t('auth.checkFormat') : ''} tone="bad" />}
        />
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: bad ? ERROR_RED : theme.colors.textSecondary, paddingLeft: 4 }}>
          {taken ? t('auth.emailTaken') : invalid ? t('auth.emailInvalid') : t('auth.emailHint')}
        </Text>
        {taken ? (
          <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 4, marginTop: 12 }}>
            <SmallPill label={t('auth.logInInstead')} ink onPress={() => router.replace(SCREENS.auth.login(trimmed))} />
            <SmallPill label={t('auth.resetPassword')} onPress={() => router.push(SCREENS.auth.forgotPassword(trimmed))} />
          </View>
        ) : null}
      </View>
    </AuthPage>
  );
}

function SmallPill({ label, onPress, ink }: { label: string; onPress: () => void; ink?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: ink ? theme.colors.ink : theme.colors.field,
        justifyContent: 'center',
        opacity: pressed ? 0.8 : 1,
      })}>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13.5, color: ink ? theme.colors.ground : theme.colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}
