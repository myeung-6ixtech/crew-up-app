import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ERROR_RED } from '@/components/auth/authKit';
import { OutlineButton, SettingsLabel, SettingsPage, SettingsRow, SettingsSection } from '@/components/settings/settingsKit';
import { BottomSheet } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { useAuth } from '@/hooks/useSession';
import { hapticSelection, hapticWarning } from '@/lib/haptics';
import { fetchDeletionInfo } from '@/services/accountService';
import { fontFamily, useTheme } from '@/theme';

function DetailRow({ label, value, note, mono, trailing }: { label: string; value: string; note?: string; mono?: boolean; trailing?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        minHeight: 68,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.mode === 'dark' ? '#262C30' : '#E6E9E1',
      }}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textSecondary }}>{label}</Text>
        <Text selectable style={{ fontFamily: mono ? fontFamily.monoMedium : fontFamily.interMedium, fontSize: mono ? 15 : 15.5, color: theme.colors.textPrimary }}>
          {value}
        </Text>
        {note ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textSecondary }}>{note}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

/**
 * 6G — account details (Crew ID, sign-up email, member since), the password, and closure. "Close your account"
 * opens the policy sheet; confirming goes on to the delete screen, which asks for DELETE and the password.
 */
export default function AccountScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [graceDays, setGraceDays] = useState(30);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchDeletionInfo()
      .then((info) => setGraceDays(info.graceDays))
      .catch(() => undefined);
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const crewId = profile?.friend_id ?? '';
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const copy = async () => {
    if (!crewId) return;
    await Clipboard.setStringAsync(crewId);
    hapticSelection();
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  };

  const points = t('settings.closePoints', { returnObjects: true, days: graceDays }) as string[];

  return (
    <SettingsPage title={t('settings.account')}>
      <SettingsSection label={t('settings.accountDetails')}>
        {crewId ? (
          <DetailRow
            label={t('settings.crewId')}
            value={crewId}
            mono
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('settings.copyCrewId')}
                onPress={() => void copy()}
                style={({ pressed }) => ({
                  height: 32,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  backgroundColor: theme.colors.field,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <Svg width={13} height={13} viewBox="0 0 24 24">
                  <Path d="M9 9h11v11H9zM5 15H4V4h11v1" stroke={theme.colors.textPrimary} strokeWidth={2} fill="none" strokeLinejoin="round" />
                </Svg>
                <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interMedium, fontSize: 12.5, color: theme.colors.textPrimary }}>
                  {copied ? t('settings.copied') : t('settings.copy')}
                </Text>
              </Pressable>
            }
          />
        ) : null}
        {user?.email ? (
          <DetailRow
            label={t('auth.email')}
            value={user.email}
            note={user.emailVerified ? t('settings.emailVerified') : t('settings.emailUnverified')}
          />
        ) : null}
        {memberSince ? <DetailRow label={t('settings.memberSince')} value={memberSince} /> : null}
      </SettingsSection>

      <SettingsSection label={t('settings.signIn')}>
        <SettingsRow icon="privacy" label={t('settings.password')} sub={t('settings.passwordSub')} onPress={() => router.push(SCREENS.profile.security)} />
      </SettingsSection>

      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, lineHeight: 20, color: theme.colors.textSecondary }}>
        {t('settings.closeLead')}{' '}
        <Text
          accessibilityRole="link"
          onPress={() => setSheet(true)}
          style={{ fontFamily: fontFamily.interMedium, color: theme.colors.textPrimary, textDecorationLine: 'underline' }}>
          {t('settings.closeLink')}
        </Text>
        .
      </Text>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} scrollable={false} heightRatio={0.66}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, letterSpacing: -0.4, color: theme.colors.textPrimary }}>
            {t('settings.closeTitle')}
          </Text>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>{t('settings.closeIntro')}</Text>
          <View style={{ gap: 12 }}>
            {points.map((point, index) => (
              <View key={point} style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.textPrimary }}>{String(index + 1).padStart(2, '0')}</Text>
                </View>
                <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textPrimary }}>{point}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 10, marginTop: 6 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                hapticWarning();
                setSheet(false);
                router.push(SCREENS.account.delete);
              }}
              style={({ pressed }) => ({
                height: 54,
                borderRadius: 27,
                backgroundColor: theme.mode === 'dark' ? '#FF8A80' : ERROR_RED,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: theme.mode === 'dark' ? '#0E1113' : '#FFFFFF' }}>{t('settings.closeConfirm')}</Text>
            </Pressable>
            <OutlineButton label={t('settings.closeKeep')} onPress={() => setSheet(false)} />
          </View>
        </View>
      </BottomSheet>
    </SettingsPage>
  );
}
