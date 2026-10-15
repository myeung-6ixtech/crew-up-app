import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthPage, BigCheckGlyph, CenterNotice, ClockGlyph, QuietAction } from '@/components/auth/authKit';
import { SCREENS } from '@/constants/screens';
import { PillCta } from '@/features/onboarding/components/kit';
import { useAuth, useSession } from '@/hooks/useSession';
import { authErrorCode, exchangeRefreshToken, sendVerificationEmail } from '@/services/authService';
import { useAuthDraftStore } from '@/stores/authDraftStore';
import { fontFamily, useTheme } from '@/theme';

type State = 'working' | 'verified' | 'expired';

/**
 * Where the verify link lands: crewup://auth/verified?refreshToken=… (4E), or ?error=… for a bad,
 * used or superseded ticket (4F). useAuthGuard leaves this screen alone so "You're verified" is seen.
 */
export default function EmailVerifiedScreen() {
  const params = useLocalSearchParams<{ refreshToken?: string; error?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { refreshSession } = useSession();
  const { isAuthenticated, user } = useAuth();
  const draftEmail = useAuthDraftStore((state) => state.email.trim());
  const clearDraft = useAuthDraftStore((state) => state.clear);
  const [state, setState] = useState<State>('working');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (params.error === 'email-already-verified') {
      router.replace(SCREENS.auth.login(draftEmail || undefined));
      return;
    }
    if (params.refreshToken) {
      exchangeRefreshToken(params.refreshToken)
        .then(async () => {
          clearDraft();
          await refreshSession();
          setState('verified');
        })
        .catch(() => setState('expired'));
      return;
    }
    setState(isAuthenticated && !params.error ? 'verified' : 'expired');
  }, [clearDraft, draftEmail, isAuthenticated, params.error, params.refreshToken, refreshSession, router]);

  const email = user?.email ?? draftEmail;

  const sendNew = async () => {
    // Opened fresh from the email, the app may not know the address; log in finds it and offers a new link.
    if (!email) {
      router.replace(SCREENS.auth.login());
      return;
    }
    setSending(true);
    setSendError('');
    try {
      await sendVerificationEmail(email);
      useAuthDraftStore.getState().setEmail(email);
      router.replace(SCREENS.auth.checkInbox('verify'));
    } catch (e) {
      if (authErrorCode(e) === 'email-already-verified') router.replace(SCREENS.auth.login(email));
      else setSendError(e instanceof Error && e.message ? e.message : t('common.error'));
    } finally {
      setSending(false);
    }
  };

  if (state === 'working') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bgCanvas }}>
        <ActivityIndicator color={theme.colors.textSecondary} />
      </View>
    );
  }

  const bodyStyle = { fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textSecondary, textAlign: 'center' as const, maxWidth: 290 };

  if (state === 'verified') {
    return (
      <AuthPage
        centered
        // The guard sends a new account on to house rules, or anyone further along to where they left off.
        footer={<PillCta label={t('common.continue')} onPress={() => router.replace(SCREENS.onboarding.houseRules)} />}>
        <CenterNotice tone="lime" icon={<BigCheckGlyph />} title={t('auth.verifiedTitle')}>
          <Text style={bodyStyle}>{email ? t('auth.verifiedBody', { email }) : t('auth.verifiedBodyNoEmail')}</Text>
        </CenterNotice>
      </AuthPage>
    );
  }

  return (
    <AuthPage
      centered
      footer={
        <>
          {sendError ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.statusOnDuty, textAlign: 'center' }}>{sendError}</Text> : null}
          <PillCta label={t('auth.sendNewLink')} loading={sending} onPress={() => void sendNew()} />
          <QuietAction label={t('auth.backToLogin')} onPress={() => router.replace(SCREENS.auth.login(email || undefined))} />
        </>
      }>
      <CenterNotice tone="field" icon={<ClockGlyph />} title={t('auth.expiredTitle')}>
        <Text style={bodyStyle}>{email ? t('auth.expiredBody', { email }) : t('auth.expiredBodyNoEmail')}</Text>
      </CenterNotice>
    </AuthPage>
  );
}
