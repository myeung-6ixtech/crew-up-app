import { useCallback, useState } from 'react';
import { AccessibilityInfo, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CrewQrSheet } from '@/components/crew/CrewQrSheet';
import { CheckGlyph as SmallCheck, CopyGlyph, QrGlyph } from '@/components/crew/qrGlyphs';
import { SCREENS } from '@/constants/screens';
import { copyToClipboard } from '@/lib/clipboard';
import { shareCrewLink } from '@/lib/shareCrewLink';
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
    AccessibilityInfo.announceForAccessibility(t('friends.crewIdCopied'));
    setTimeout(() => setCopied(false), 1800);
  }, [code, t]);

  // Shares the Crew ID with the CrewUp link that opens Add friend.
  const share = useCallback(async () => {
    if (!code || !friendId) return;
    hapticSelection();
    await shareCrewLink(friendId, t);
  }, [code, friendId, t]);

  return { code, copied, copy, share };
}

function ShareGlyph() {
  return (
    <Svg width={12} height={13} viewBox="0 0 12 13">
      <Path d="M6 8.5V1.5M3 4l3-3 3 3M1.5 7v3.5a1 1 0 001 1h7a1 1 0 001-1V7" stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Chip({
  label,
  onPress,
  tone,
  icon,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  tone: 'lime' | 'pale';
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
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

/**
 * Dark Crew ID card: QR (opens "Your Crew QR") and Share, then the code in lime mono with a round copy button beside
 * it (flips to a check and announces "Crew ID copied").
 */
export function CrewIdDarkCard({ friendId }: { friendId: string | null | undefined }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { code, copied, copy, share } = useCrewIdActions(friendId);
  const [qrOpen, setQrOpen] = useState(false);
  if (!code) return null;
  return (
    <View style={{ backgroundColor: INK, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: PALE }}>{t('friends.crewId')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip
            tone="lime"
            label={t('friends.qr')}
            accessibilityLabel={t('friends.showMyQr')}
            icon={<QrGlyph color={INK} />}
            onPress={() => {
              hapticSelection();
              setQrOpen(true);
            }}
          />
          <Chip tone="pale" label={t('friends.shareCrewId')} icon={<ShareGlyph />} onPress={() => void share()} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text selectable style={{ flexShrink: 1, fontFamily: fontFamily.monoMedium, fontSize: 22, letterSpacing: 1.3, color: LIME }}>
          {code}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copied ? t('friends.crewIdCopied') : t('friends.copyCrewId')}
          onPress={() => void copy()}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: copied ? LIME : 'rgba(237,241,242,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.75 : 1,
          })}>
          {copied ? <SmallCheck color={INK} size={12} /> : <CopyGlyph color={PALE} />}
        </Pressable>
      </View>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: MUTED }}>{t('friends.crewIdHint')}</Text>
      <CrewQrSheet
        visible={qrOpen}
        onClose={() => setQrOpen(false)}
        onScan={() => {
          // Open the camera once the sheet has slid away.
          setQrOpen(false);
          setTimeout(() => router.push(SCREENS.friends.scan), 320);
        }}
      />
    </View>
  );
}
