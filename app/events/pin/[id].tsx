import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleButton } from '@/components/crew/kit';
import { LockGlyph } from '@/components/events/pin';
import { Screen, Toast } from '@/components/ui';
import { formatEventPin } from '@/constants/events';
import { SCREENS } from '@/constants/screens';
import { PillCta } from '@/features/onboarding/components/kit';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticSuccess } from '@/lib/haptics';
import { formatDateTime } from '@/lib/utils';
import { fetchEvent, fetchEventPin } from '@/services/eventService';
import { fontFamily, useTheme } from '@/theme';

/**
 * PIN ready — design/…/CrewUp Events Prototype.dc.html, 6E. Straight after saving a private meet: the PIN to copy or
 * share. The host already has full access and never enters it.
 */
export default function PinReadyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const [pin, setPin] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [failed, setFailed] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!id) return;
    void Promise.all([fetchEventPin(client, id), fetchEvent(client, id)])
      .then(([row, event]) => {
        setPin(row?.pin ?? null);
        setFailed(!row?.pin);
        setTitle(event?.title ?? '');
        setWhen(event?.starts_at ? formatDateTime(event.starts_at) : '');
      })
      .catch(() => setFailed(true));
  }, [client, id]);

  const shown = pin ? formatEventPin(pin) : '';
  const viewMeet = () => id && router.replace(SCREENS.events.detail(id));

  const copy = async () => {
    if (!shown) return;
    await Clipboard.setStringAsync(shown);
    hapticSuccess();
    setToast(t('eventPin.copied'));
  };

  const share = () => {
    if (!shown) return;
    void Share.share({ message: t('eventPin.shareMessage', { title, when, pin: shown }) });
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20, alignItems: 'flex-end' }}>
        <CircleButton accessibilityLabel={t('common.close')} onPress={viewMeet}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M6 6l12 12M18 6L6 18" stroke={theme.colors.textPrimary} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </CircleButton>
      </View>
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 20, paddingHorizontal: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#A8E05F', alignItems: 'center', justifyContent: 'center' }}>
          <LockGlyph color="#0E1113" size={26} />
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: theme.colors.textPrimary, marginTop: 20, textAlign: 'center' }}>
          {t('eventPin.readyTitle')}
        </Text>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary, marginTop: 8, maxWidth: 290, textAlign: 'center' }}>
          {title ? `${title} · ${t('eventPin.readyBody')}` : t('eventPin.readyBody')}
        </Text>

        {shown ? (
          <View accessible accessibilityLabel={t('eventPin.pinIs', { pin: shown.split('').join(' ') })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28 }}>
            {shown.split('').map((char, index) =>
              char === '-' ? (
                <View key={index} style={{ width: 12, height: 2, borderRadius: 1, backgroundColor: theme.colors.textPrimary }} />
              ) : (
                <View
                  key={index}
                  style={{
                    width: 40,
                    height: 54,
                    borderRadius: 12,
                    backgroundColor: theme.colors.card,
                    borderWidth: 1.5,
                    borderColor: theme.mode === 'dark' ? '#3A4145' : '#D4D8CD',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 24, color: theme.colors.textPrimary }}>{char}</Text>
                </View>
              ),
            )}
          </View>
        ) : failed ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary, marginTop: 28, textAlign: 'center' }}>{t('eventPin.readyMissing')}</Text>
        ) : (
          <ActivityIndicator color={theme.colors.textSecondary} style={{ marginTop: 40 }} />
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' }}>
          <Pressable
            accessibilityRole="button"
            disabled={!shown}
            onPress={() => void copy()}
            style={({ pressed }) => ({ flex: 1, height: 50, borderRadius: 25, backgroundColor: '#0E1113', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !shown ? 0.4 : pressed ? 0.8 : 1 })}>
            <Svg width={15} height={15} viewBox="0 0 24 24">
              <Rect x={9} y={9} width={11} height={11} rx={2} stroke="#A8E05F" strokeWidth={2} fill="none" />
              <Path d="M5 15H4V4h11v1" stroke="#A8E05F" strokeWidth={2} fill="none" strokeLinejoin="round" />
            </Svg>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14.5, color: '#A8E05F' }}>{t('eventPin.copyPin')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!shown}
            onPress={share}
            style={({ pressed }) => ({ flex: 1, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: theme.mode === 'dark' ? '#3A4145' : '#C9CEC1', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !shown ? 0.4 : pressed ? 0.7 : 1 })}>
            <Svg width={15} height={15} viewBox="0 0 24 24">
              <Path d="M12 15V3M7 7.5L12 3l5 4.5M5 12v7.5A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5V12" stroke={theme.colors.textPrimary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14.5, color: theme.colors.textPrimary }}>{t('eventPin.share')}</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 22, alignSelf: 'stretch', backgroundColor: theme.colors.card, borderRadius: 18, paddingVertical: 4, paddingHorizontal: 16 }}>
          {[t('eventPin.readyTip1'), t('eventPin.readyTip2')].map((tip, index) => (
            <View
              key={tip}
              style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: index === 0 ? 1 : 0, borderBottomColor: theme.mode === 'dark' ? '#262C30' : '#EEF0EA' }}>
              <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.accentText, paddingTop: 2 }}>{`0${index + 1}`}</Text>
              <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textPrimary }}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ paddingTop: 12, paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 14) + 6 }}>
        <PillCta label={t('eventPin.viewMeet')} onPress={viewMeet} />
      </View>
      <Toast message={toast} visible={Boolean(toast)} onHide={() => setToast('')} />
    </Screen>
  );
}
