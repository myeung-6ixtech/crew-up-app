import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthPage, CenterNotice, InlineLink, MailGlyph, OutlinePill, QuietAction, openMailApp } from '@/components/auth/authKit';
import { SCREENS } from '@/constants/screens';
import { PillCta } from '@/features/onboarding/components/kit';
import { useSession } from '@/hooks/useSession';
import { hapticError } from '@/lib/haptics';
import { authErrorCode, sendVerificationEmail, signIn } from '@/services/authService';
import { useAuthDraftStore } from '@/stores/authDraftStore';
import { fontFamily, useTheme } from '@/theme';

const RESEND_COOLDOWN = 30;

/**
 * 4C after sign up (resend, change email, or log in once verified elsewhere) and 4K after a reset request.
 * The reset wording stays neutral — "if it has an account" — whether or not one exists.
 */
export default function CheckInboxScreen() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const reset = kind === 'reset';
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { refreshSession } = useSession();
  const email = useAuthDraftStore((state) => state.email.trim());
  const password = useAuthDraftStore((state) => state.password);
  const clearDraft = useAuthDraftStore((state) => state.clear);
  const [resendIn, setResendIn] = useState(0);
  const [note, setNote] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const resend = async () => {
    if (resendIn > 0 || !email) return;
    setResendIn(RESEND_COOLDOWN);
    timer.current = setInterval(() => {
      setResendIn((value) => {
        if (value <= 1 && timer.current) clearInterval(timer.current);
        return Math.max(0, value - 1);
      });
    }, 1000);
    try {
      await sendVerificationEmail(email);
      setNote(t('auth.resent'));
    } catch (e) {
      if (authErrorCode(e) === 'email-already-verified') {
        setNote(t('auth.alreadyVerified'));
        return;
      }
      setNote(e instanceof Error && e.message ? e.message : t('common.error'));
    }
  };

  // Verified on a laptop: the app redirect never fires, so sign in with what was just typed.
  const logInVerified = async () => {
    if (!email || !password) {
      router.replace(SCREENS.auth.login(email || undefined));
      return;
    }
    setLoggingIn(true);
    try {
      await signIn(email, password);
      clearDraft();
      await refreshSession();
    } catch (e) {
      hapticError();
      if (authErrorCode(e) === 'unverified-user') setNote(t('auth.notVerifiedYet'));
      else router.replace(SCREENS.auth.login(email));
    } finally {
      setLoggingIn(false);
    }
  };

  const body = (
    <View style={{ alignItems: 'center', gap: 4 }}>
      {reset ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textSecondary, textAlign: 'center', maxWidth: 300 }}>
          {t('auth.resetSent', { email: email || t('auth.yourEmail') })}
        </Text>
      ) : (
        <>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textSecondary }}>{t('auth.sentVerifyTo')}</Text>
          <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{email}</Text>
          <View style={{ marginTop: 4 }}>
            <InlineLink label={t('auth.wrongEmail')} onPress={() => router.replace(SCREENS.auth.signUp)} />
          </View>
        </>
      )}
    </View>
  );

  return (
    <AuthPage
      centered
      footer={
        <>
          <PillCta label={t('auth.openMail')} onPress={() => void openMailApp()} />
          {reset ? (
            <QuietAction label={t('auth.backToLogin')} onPress={() => router.replace(SCREENS.auth.login(email || undefined))} />
          ) : (
            <>
              <OutlinePill
                label={resendIn > 0 ? t('auth.resendIn', { time: `0:${String(resendIn).padStart(2, '0')}` }) : t('auth.resend')}
                disabled={resendIn > 0}
                onPress={() => void resend()}
              />
              <QuietAction label={loggingIn ? t('auth.loggingIn') : t('auth.verifiedElsewhere')} onPress={() => void logInVerified()} />
            </>
          )}
        </>
      }>
      <CenterNotice tone="lime" icon={<MailGlyph />} title={t('auth.checkInbox')}>
        {body}
        {!reset ? (
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textTertiary, textAlign: 'center' }}>
            {note || t('auth.checkSpam')}
          </Text>
        ) : null}
      </CenterNotice>
    </AuthPage>
  );
}
