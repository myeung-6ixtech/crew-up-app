import { Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { CrewAvatar } from '@/components/crew/kit';
import { personName } from '@/components/crew/people';
import { CheckGlyph, CloseGlyph, CopyGlyph, ScanFrameGlyph } from '@/components/crew/qrGlyphs';
import { BottomSheet } from '@/components/ui';
import { crewLink } from '@/lib/crewLink';
import { shareCrewLink } from '@/lib/shareCrewLink';
import { hapticSelection } from '@/lib/haptics';
import { useAuth } from '@/hooks/useSession';
import { fontFamily, useTheme } from '@/theme';
import { useCrewIdActions } from '@/components/crew/CrewIdDarkCard';

const INK = '#0E1113';

/**
 * "Your Crew QR": a QR of your CrewUp link (only the Crew ID is in it), your avatar in the middle, name and Crew ID.
 * Share sends the link; Scan a code opens the scanner. Close or swipe down to dismiss.
 */
export function CrewQrSheet({ visible, onClose, onScan }: { visible: boolean; onClose: () => void; onScan: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { profile, userId } = useAuth();
  const { code, copied, copy } = useCrewIdActions(profile?.friend_id);
  if (!code || !profile?.friend_id) return null;
  const link = crewLink(profile.friend_id);
  const name = personName(profile);

  const share = async () => {
    hapticSelection();
    await shareCrewLink(profile.friend_id as string, t);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 24, letterSpacing: -0.5, color: theme.colors.textPrimary }}>
              {t('friends.qrTitle')}
            </Text>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 19, color: theme.colors.textSecondary }}>{t('friends.qrHelper')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
            hitSlop={8}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
            <CloseGlyph color={theme.colors.textPrimary} size={10} />
          </Pressable>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 22, paddingHorizontal: 20, alignItems: 'center', gap: 12, borderWidth: theme.mode === 'dark' ? 0 : 1, borderColor: theme.colors.hairline }}>
          <View accessible accessibilityRole="image" accessibilityLabel={t('friends.qrA11y', { name })} style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
            {/* High error correction so the avatar in the middle doesn't stop it scanning. */}
            <QRCode value={link} size={220} color={INK} backgroundColor="#FFFFFF" ecl="H" quietZone={0} />
            <View style={{ position: 'absolute', width: 56, height: 56, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <CrewAvatar name={name} fileId={profile.avatar_file_id} seed={userId} size={44} />
            </View>
          </View>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: INK }}>{name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text selectable style={{ fontFamily: fontFamily.monoMedium, fontSize: 15, letterSpacing: 1, color: '#4F6E19' }}>
              {code}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copied ? t('friends.crewIdCopied') : t('friends.copyCrewId')}
              onPress={() => void copy()}
              hitSlop={6}
              style={({ pressed }) => ({ width: 28, height: 28, borderRadius: 14, backgroundColor: '#EAECE5', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
              {copied ? <CheckGlyph color={INK} size={11} /> : <CopyGlyph color={INK} size={12} />}
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void share()}
            style={({ pressed }) => ({ flex: 1, height: 50, borderRadius: 25, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: theme.colors.onFill }}>{t('friends.shareCrewId')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              hapticSelection();
              onScan();
            }}
            style={({ pressed }) => ({
              flex: 1,
              height: 50,
              borderRadius: 25,
              borderWidth: 1.5,
              borderColor: theme.colors.hairline,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.85 : 1,
            })}>
            <ScanFrameGlyph color={theme.colors.textPrimary} size={16} />
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: theme.colors.textPrimary }}>{t('friends.scanACode')}</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}
