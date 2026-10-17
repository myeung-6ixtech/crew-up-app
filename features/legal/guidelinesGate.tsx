import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { GUIDELINES_VERSION } from '@crewup/shared';
import { LegalNotice } from '@/components/legal/LegalNotice';
import { AppIcon, BottomSheet } from '@/components/ui';
import { PillCta } from '@/features/onboarding/components/kit';
import { useSession } from '@/hooks/useSession';
import { callClientFunction, FunctionError } from '@/lib/api/functions';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

type GateState = {
  resolve: ((accepted: boolean) => void) | null;
  open: () => Promise<boolean>;
  finish: (accepted: boolean) => void;
};

const useGateStore = create<GateState>((set, get) => ({
  resolve: null,
  open: () =>
    new Promise<boolean>((resolve) => {
      get().resolve?.(false);
      set({ resolve });
    }),
  finish: (accepted) => {
    get().resolve?.(accepted);
    set({ resolve: null });
  },
}));

/**
 * Resolves true when the caller has accepted the current guidelines and Terms, opening the acceptance sheet first
 * if not. Call before sending a message, creating a meet or RSVPing; the server rejects those inserts otherwise.
 */
export function useGuidelinesGate() {
  const { onboarding } = useSession();
  const open = useGateStore((state) => state.open);
  return useCallback(async () => {
    if (onboarding?.guidelines_accepted_version === GUIDELINES_VERSION) return true;
    return open();
  }, [onboarding?.guidelines_accepted_version, open]);
}

/** Mounted once at the root. Blocking: the action only continues after Agree. */
export function GuidelinesGateSheet() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { refreshProfile } = useSession();
  const visible = useGateStore((state) => state.resolve !== null);
  const finish = useGateStore((state) => state.finish);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const points = t('onboarding.guidelines.points', { returnObjects: true }) as string[];

  const close = (accepted: boolean) => {
    setChecked(false);
    setError('');
    finish(accepted);
  };

  const accept = async () => {
    setSaving(true);
    setError('');
    try {
      await callClientFunction('legal/accept', { body: { version: GUIDELINES_VERSION } });
      await refreshProfile();
      hapticSuccess();
      close(true);
    } catch (e) {
      hapticError();
      setError(e instanceof FunctionError && e.code === 'GUIDELINES_VERSION_MISMATCH' ? t('guidelinesGate.updateApp') : t('onboarding.genericError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={() => close(false)} title={t('guidelinesGate.title')} heightRatio={0.85}>
      <View style={{ gap: 14, paddingBottom: 12 }}>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>{t('guidelinesGate.intro')}</Text>
        {points.map((point) => (
          <View key={point} style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.accentText, marginTop: 8 }} />
            <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 22, color: theme.colors.textPrimary }}>{point}</Text>
          </View>
        ))}
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, lineHeight: 21, color: theme.colors.textPrimary }}>
          {t('onboarding.guidelines.zeroTolerance')}
        </Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          onPress={() => setChecked((value) => !value)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <AppIcon name={checked ? 'checkboxOn' : 'checkboxOff'} size={24} color={checked ? theme.colors.accentText : theme.colors.textTertiary} />
          <LegalNotice
            i18nKey="onboarding.guidelines.acceptWithTerms"
            linkColor={theme.colors.accentText}
            style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textPrimary }}
          />
        </Pressable>
        {error ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.statusOnDuty }}>{error}</Text> : null}
        <PillCta label={t('guidelinesGate.agree')} disabled={!checked} loading={saving} onPress={() => void accept()} />
      </View>
    </BottomSheet>
  );
}
