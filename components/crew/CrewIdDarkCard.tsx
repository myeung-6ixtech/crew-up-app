import { useCallback, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { copyToClipboard } from '@/lib/clipboard';
import { formatFriendId } from '@/lib/friendId';
import { hapticSelection, hapticSuccess } from '@/lib/haptics';
import { fontFamily } from '@/theme';

const INK = '#0E1113';
const LIME = '#A8E05F';
const PALE = '#EDF1F2';
const MUTED = '#A7B1B5';

/** Copy puts the dashed form on the clipboard; Share opens the system sheet. */
export function useCrewIdActions(friendId: string | null | undefined) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const code = friendId ? formatFriendId(friendId) : null;

  const copy = useCallback(async () => {
    if (!code) return;
    await copyToClipboard(code);
    hapticSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [code]);

  const share = useCallback(async () => {
    if (!code) return;
    hapticSelection();
    await Share.share({ message: t('friends.shareCrewIdMessage', { crewId: code }) });
  }, [code, t]);

  return { code, copied, copy, share };
}

function CheckGlyph() {
  return (
    <Svg width={12} height={10} viewBox="0 0 10 8">
      <Path d="M1 4l2.8 2.8L9 1.2" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShareGlyph() {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13">
      <Path d="M6 8.5V1.5M3 4l3-3 3 3M1.5 7v3.5a1 1 0 001 1h7a1 1 0 001-1V7" stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Chip({ label, onPress, tone, icon }: { label: string; onPress: () => void; tone: 'lime' | 'pale'; icon?: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 32,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: tone === 'lime' ? LIME : PALE,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}>
      {icon}
      <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 12.5, color: INK }}>{label}</Text>
    </Pressable>
  );
}

/** Dark Crew ID card: the code in lime mono, Copy (icon flips to a check) and Share. */
export function CrewIdDarkCard({ friendId }: { friendId: string | null | undefined }) {
  const { t } = useTranslation();
  const { code, copied, copy, share } = useCrewIdActions(friendId);
  if (!code) return null;
  return (
    <View style={{ backgroundColor: INK, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: PALE }}>{t('friends.crewId')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip
            tone="lime"
            label={copied ? t('friends.copiedCrewId') : t('friends.copyCrewId')}
            icon={copied ? <CheckGlyph /> : undefined}
            onPress={() => void copy()}
          />
          <Chip tone="pale" label={t('friends.shareCrewId')} icon={<ShareGlyph />} onPress={() => void share()} />
        </View>
      </View>
      <Text selectable style={{ fontFamily: fontFamily.monoMedium, fontSize: 22, letterSpacing: 1.3, color: LIME }}>
        {code}
      </Text>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: MUTED }}>{t('friends.crewIdHint')}</Text>
    </View>
  );
}
