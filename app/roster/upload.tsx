import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { FlowFooter, FlowTitle, FlowTopBar, UploadGlyph, WarnChip } from '@/components/roster/flowKit';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { MonoLabel, TextAction } from '@/features/onboarding/components/kit';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatApolloError, graphQLErrorCode } from '@/lib/graphqlError';
import { hapticImpact } from '@/lib/haptics';
import { uploadAndParseRoster } from '@/services/rosterService';
import { useRosterDraftStore } from '@/stores/rosterDraftStore';
import { fontFamily, useTheme } from '@/theme';

const ROSTER_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/webp'];
const FORMAT_CHIPS = ['PDF', 'PNG', 'JPEG', 'HEIC', 'WEBP'];

type PickedFile = { uri: string; name: string; mimeType: string; size?: number | null };

function imageMimeType(mimeType: string | null | undefined, name: string): string {
  const mime = mimeType?.toLowerCase();
  if (mime === 'image/jpg') return 'image/jpeg';
  if (mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/heic' || mime === 'image/heif') {
    return mime;
  }
  if (/\.png$/i.test(name)) return 'image/png';
  if (/\.webp$/i.test(name)) return 'image/webp';
  if (/\.heic$/i.test(name)) return 'image/heic';
  if (/\.heif$/i.test(name)) return 'image/heif';
  return 'image/jpeg';
}

function fileBadge(file: PickedFile) {
  if (file.mimeType === 'application/pdf') return 'PDF';
  return file.mimeType.replace('image/', '').toUpperCase().replace('JPEG', 'JPG');
}

function formatSize(bytes?: number | null) {
  if (!bytes) return null;
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function LockGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={16} viewBox="0 0 16 18">
      <Rect x={2} y={8} width={12} height={9} rx={2} fill={color} />
      <Path d="M5 8V5.5a3 3 0 016 0V8" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

/** Upload your roster: pick a PDF or screenshot; it is read before anything is saved. Errors stay here and point at manual entry. */
export default function RosterUploadScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const setDraft = useRosterDraftStore((s) => s.setDraft);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<PickedFile | null>(null);

  const describeError = (e: unknown) => {
    const code = graphQLErrorCode(e);
    const key = `roster.errors.${code}`;
    return code && i18n.exists(key) ? t(key) : formatApolloError(e);
  };

  const submitRoster = async (picked: PickedFile) => {
    setFile(picked);
    setLoading(true);
    setError('');
    try {
      const { fileId, parsed } = await uploadAndParseRoster(client, picked);
      if (!parsed?.entries?.length) {
        setError(t('roster.errors.noLayovers'));
        return;
      }
      setDraft(fileId, parsed.entries);
      router.push(SCREENS.roster.confirm);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  };

  const pickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ROSTER_FILE_TYPES });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    const name = asset.name ?? 'roster';
    const mimeType = asset.mimeType?.toLowerCase() === 'image/jpg' ? 'image/jpeg' : (asset.mimeType ?? 'application/pdf');
    await submitRoster({ uri: asset.uri, name, mimeType, size: asset.size });
  };

  const pickPhoto = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    const name = asset.fileName ?? 'roster.jpg';
    await submitRoster({ uri: asset.uri, name, mimeType: imageMimeType(asset.mimeType, name), size: asset.fileSize });
  };

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <FlowTopBar title={t('rosterFlow.uploadStackTitle')} backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 22, paddingHorizontal: 24, paddingBottom: 16 }}>
        <FlowTitle>{t('roster.uploadTitle')}</FlowTitle>
        {!error ? (
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary, marginTop: 10 }}>
            {t('roster.uploadBody')}
          </Text>
        ) : null}

        {error && file ? (
          <>
            <View style={{ marginTop: 22, backgroundColor: theme.colors.card, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 42,
                  height: 50,
                  borderRadius: 8,
                  backgroundColor: theme.colors.field,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 6,
                }}>
                <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 9, color: theme.colors.textSecondary }}>{fileBadge(file)}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 14.5, color: theme.colors.textPrimary }}>
                  {file.name}
                </Text>
                {formatSize(file.size) ? (
                  <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>{formatSize(file.size)}</Text>
                ) : null}
              </View>
            </View>
            <View accessibilityLiveRegion="polite" style={{ marginTop: 12, backgroundColor: '#FBEFD0', borderRadius: 18, padding: 16, gap: 6 }}>
              <WarnChip label={t('rosterFlow.couldntRead')} />
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14.5, lineHeight: 22, color: '#3A2C00' }}>{error}</Text>
            </View>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('roster.chooseFile')}
            disabled={loading}
            onPress={() => {
              hapticImpact();
              void pickFile();
            }}
            style={({ pressed }) => ({
              marginTop: 24,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: theme.colors.textTertiary,
              borderRadius: 24,
              backgroundColor: theme.colors.card,
              paddingVertical: 28,
              paddingHorizontal: 20,
              alignItems: 'center',
              gap: 12,
              opacity: pressed ? 0.85 : 1,
            })}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }}>
              <UploadGlyph color={theme.colors.onFill} size={28} />
            </View>
            <Text numberOfLines={1} style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>
              {loading && file ? file.name : t('rosterFlow.chooseYourRoster')}
            </Text>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary, textAlign: 'center' }}>
              {loading ? t('rosterFlow.readingShort') : t('rosterFlow.limits')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 }}>
              {FORMAT_CHIPS.map((chip) => (
                <MonoLabel
                  key={chip}
                  style={{
                    fontSize: 10.5,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.field,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}>
                  {chip}
                </MonoLabel>
              ))}
            </View>
          </Pressable>
        )}

        {!loading ? (
          <View style={{ alignItems: 'center', marginTop: 14 }}>
            <TextAction label={t('rosterFlow.pickScreenshot')} onPress={() => void pickPhoto()} style={{ color: theme.colors.accentText }} />
          </View>
        ) : null}

        {error ? (
          <>
            <MonoLabel style={{ fontSize: 10.5, marginTop: 26 }}>{t('rosterFlow.otherWays')}</MonoLabel>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 19, color: theme.colors.textSecondary, marginTop: 8 }}>
              {t('rosterFlow.otherWaysBody')}
            </Text>
          </>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: theme.colors.field, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, marginTop: 14 }}>
            <View style={{ marginTop: 1 }}>
              <LockGlyph color={theme.colors.textPrimary} />
            </View>
            <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 19, color: theme.colors.textSecondary }}>
              {t('roster.uploadPrivacy')}
            </Text>
          </View>
        )}
      </ScrollView>
      <FlowFooter
        bottomInset={insets.bottom}
        primary={{
          label: loading ? t('roster.reading') : error ? t('rosterFlow.chooseAnother') : t('roster.chooseFile'),
          disabled: loading,
          onPress: () => void pickFile(),
        }}
        secondary={{
          label: t('roster.manual'),
          disabled: loading,
          onPress: () => {
            setDraft(undefined, []);
            router.push(SCREENS.roster.confirm);
          },
        }}
      />
    </Screen>
  );
}
