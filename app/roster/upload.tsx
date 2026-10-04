import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { RowChevron } from '@/components/crew/kit';
import { FlowFooter, FlowTitle, FlowTopBar, WarnChip } from '@/components/roster/flowKit';
import { RosterProcessing, type ProcessingPhase } from '@/components/roster/RosterProcessing';
import { Screen } from '@/components/ui';
import { SCREENS } from '@/constants/screens';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatApolloError, graphQLErrorCode } from '@/lib/graphqlError';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { uploadAndParseRoster } from '@/services/rosterService';
import { useRosterDraftStore } from '@/stores/rosterDraftStore';
import { fontFamily, useTheme } from '@/theme';
import type { ParsedRosterEntry } from '@/types/domain';

const ROSTER_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/heic', 'image/webp'];
const IOS = Platform.OS === 'ios';

type PickedFile = { uri: string; name: string; mimeType: string; size?: number | null };
type Source = 'photos' | 'files';

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

function PhotosGlyph({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Rect x={3} y={4} width={18} height={16} rx={3} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={9} cy={9.5} r={1.8} fill={color} />
      <Path d="M4 17l5-4.5 3.5 3 3-2.5L20 17" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function FileGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={24} viewBox="0 0 22 24">
      <Path d="M4 2h9l5 5v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Path d="M13 2v5h5" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Path d="M7 13h8M7 17h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SourceCard({
  title,
  tag,
  subtitle,
  formats,
  icon,
  iconBg,
  opening,
  onPress,
}: {
  title: string;
  tag: string;
  subtitle: string;
  formats: string[];
  icon: React.ReactNode;
  iconBg: string;
  opening: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.card,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: opening ? theme.colors.ink : theme.colors.card,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: pressed ? 0.88 : 1,
      })}>
      <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16.5, color: theme.colors.textPrimary }}>{title}</Text>
          <MonoLabel style={{ fontSize: 9.5, color: theme.colors.accentText }}>{tag}</MonoLabel>
        </View>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: opening ? theme.colors.accentText : theme.colors.textSecondary }}>
          {subtitle}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
          {formats.map((format) => (
            <Text
              key={format}
              style={{
                fontFamily: fontFamily.monoMedium,
                fontSize: 10,
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.field,
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: 7,
                overflow: 'hidden',
              }}>
              {format}
            </Text>
          ))}
        </View>
      </View>
      <RowChevron color={theme.colors.textTertiary} />
    </Pressable>
  );
}

/**
 * Upload your roster: two clearly separate sources — a screenshot from Photos, or the PDF from Files.
 * Reading happens on a full-page dark wait screen; errors come back here and point at manual entry.
 */
export default function RosterUploadScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = useApolloClient();
  const setDraft = useRosterDraftStore((s) => s.setDraft);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState<Source | null>(null);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [phase, setPhase] = useState<ProcessingPhase | null>(null);
  const [result, setResult] = useState<{ fileId: string; entries: ParsedRosterEntry[] } | null>(null);
  const runRef = useRef(0);

  const describeError = (e: unknown) => {
    const code = graphQLErrorCode(e);
    const key = `roster.errors.${code}`;
    return code && i18n.exists(key) ? t(key) : formatApolloError(e);
  };

  const submitRoster = async (picked: PickedFile) => {
    const run = ++runRef.current;
    setFile(picked);
    setError('');
    setResult(null);
    setPhase('uploading');
    try {
      const { fileId, parsed } = await uploadAndParseRoster(client, picked, () => {
        if (runRef.current === run) setPhase('reading');
      });
      if (runRef.current !== run) return;
      if (!parsed?.entries?.length) {
        hapticError();
        setPhase(null);
        setError(t('roster.errors.noLayovers'));
        return;
      }
      hapticSuccess();
      setResult({ fileId, entries: parsed.entries });
      setPhase('done');
    } catch (e) {
      if (runRef.current !== run) return;
      hapticError();
      setPhase(null);
      setError(describeError(e));
    }
  };

  // Cancel stops waiting for this read; anything that comes back afterwards is ignored.
  const cancel = () => {
    runRef.current += 1;
    setPhase(null);
    setResult(null);
  };

  const review = () => {
    if (!result) return;
    setDraft(result.fileId, result.entries);
    setPhase(null);
    router.push(SCREENS.roster.confirm);
  };

  const pickFile = async () => {
    setOpening('files');
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ROSTER_FILE_TYPES });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = picked.assets[0];
      const name = asset.name ?? 'roster';
      const mimeType = asset.mimeType?.toLowerCase() === 'image/jpg' ? 'image/jpeg' : (asset.mimeType ?? 'application/pdf');
      void submitRoster({ uri: asset.uri, name, mimeType, size: asset.size });
    } finally {
      setOpening(null);
    }
  };

  const pickPhoto = async () => {
    setOpening('photos');
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = picked.assets[0];
      const name = asset.fileName ?? 'roster.jpg';
      void submitRoster({ uri: asset.uri, name, mimeType: imageMimeType(asset.mimeType, name), size: asset.fileSize });
    } finally {
      setOpening(null);
    }
  };

  if (phase && file) {
    return (
      <RosterProcessing
        fileName={file.name}
        phase={phase}
        flights={result?.entries.filter((entry) => entry.flightNumber).length ?? 0}
        layovers={result?.entries.length ?? 0}
        onReview={review}
        onCancel={cancel}
      />
    );
  }

  return (
    <Screen style={{ padding: 0 }}>
      <View style={{ paddingTop: insets.top }}>
        <FlowTopBar title={t('rosterFlow.uploadStackTitle')} backLabel={t('common.back')} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 22, paddingHorizontal: 24, paddingBottom: 16 }}>
        <FlowTitle>{t('roster.uploadTitle')}</FlowTitle>

        {error && file ? (
          <>
            <View style={{ marginTop: 22, backgroundColor: theme.colors.card, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 42, height: 50, borderRadius: 8, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 }}>
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
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 22, color: theme.colors.textSecondary, marginTop: 10 }}>
            {t('roster.uploadBody')}
          </Text>
        )}

        <MonoLabel style={{ fontSize: 10.5, marginTop: 24 }}>{error ? t('rosterFlow.tryAnother') : t('rosterFlow.whereSaved')}</MonoLabel>
        <View style={{ gap: 10, marginTop: 10 }}>
          <SourceCard
            title={IOS ? t('rosterFlow.photosIos') : t('rosterFlow.photosAndroid')}
            tag={t('rosterFlow.screenshotTag')}
            subtitle={opening === 'photos' ? (IOS ? t('rosterFlow.openingPhotos') : t('rosterFlow.openingGallery')) : t('rosterFlow.photosBody')}
            formats={IOS ? ['PNG', 'JPEG', 'HEIC'] : ['PNG', 'JPEG', 'WEBP']}
            icon={<PhotosGlyph color={theme.colors.onFill} />}
            iconBg={theme.colors.fill}
            opening={opening === 'photos'}
            onPress={() => void pickPhoto()}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.track }} />
            <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10, color: theme.colors.textTertiary }}>{t('rosterFlow.or')}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.track }} />
          </View>
          <SourceCard
            title={IOS ? t('rosterFlow.filesIos') : t('rosterFlow.filesAndroid')}
            tag="PDF"
            subtitle={opening === 'files' ? t('rosterFlow.openingFiles') : IOS ? t('rosterFlow.filesBodyIos') : t('rosterFlow.filesBodyAndroid')}
            formats={['PDF']}
            icon={<FileGlyph color="#A8E05F" />}
            iconBg="#0E1113"
            opening={opening === 'files'}
            onPress={() => void pickFile()}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: theme.colors.field, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 14, marginTop: 14 }}>
          <View style={{ marginTop: 1 }}>
            <LockGlyph color={theme.colors.textPrimary} />
          </View>
          <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 19, color: theme.colors.textSecondary }}>
            {t('roster.uploadPrivacy')}
          </Text>
        </View>
      </ScrollView>
      <FlowFooter
        bottomInset={insets.bottom}
        secondary={{
          label: t('roster.manual'),
          onPress: () => {
            setDraft(undefined, []);
            router.push(SCREENS.roster.confirm);
          },
        }}
      />
    </Screen>
  );
}
