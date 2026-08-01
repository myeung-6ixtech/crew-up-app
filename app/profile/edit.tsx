import { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApolloClient } from '@/lib/apolloHooks';
import {
  Screen,
  Avatar,
  Input,
  Button,
  LabelText,
  Subtitle,
  BodyText,
  Badge,
  SelectionOption,
  SectionLabel,
  AppIcon,
} from '@/components/ui';
import { ROLE_TYPES, VISIBILITY_LEVELS, type VisibilityLevel } from '@/constants/screens';
import { formatApolloError } from '@/lib/graphqlError';
import { useAuth, useSession } from '@/hooks/useSession';
import { fetchAirlines, submitVerification, updateProfile } from '@/services/profileService';
import { uploadFile } from '@/services/uploadService';
import { useThemedStyles, useTheme } from '@/theme';

const BIO_MAX = 160;

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const client = useApolloClient();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, userId, isVerified } = useAuth();
  const { refreshProfile } = useSession();
  const styles = useThemedStyles((t) => ({
    scroll: { padding: t.spacing.lg, paddingBottom: t.spacing.xxxl + 80 },
    avatarSection: { alignItems: 'center', marginBottom: t.spacing.xl, gap: t.spacing.sm },
    avatarPress: { position: 'relative' },
    editBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 36,
      height: 36,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.bgSurfaceRaised,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: { marginBottom: t.spacing.xl },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: t.spacing.lg,
      paddingTop: t.spacing.md,
      paddingBottom: Math.max(insets.bottom, t.spacing.lg),
      backgroundColor: t.colors.bgCanvas,
      borderTopWidth: 1,
      borderTopColor: t.colors.hairline,
      gap: t.spacing.xs,
    },
    verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.sm },
  }));

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [roleType, setRoleType] = useState(profile?.role_type ?? ROLE_TYPES[0]);
  const [base, setBase] = useState(profile?.base_airport ?? '');
  const [bio, setBio] = useState('');
  const [airlineId, setAirlineId] = useState<string | undefined>(profile?.airline_id ?? undefined);
  const [visibility, setVisibility] = useState<VisibilityLevel>(profile?.default_visibility ?? 'friends');
  const [statusDefaultHidden, setStatusDefaultHidden] = useState(profile?.default_visibility === 'off');
  const [notificationMode, setNotificationMode] = useState(profile?.notification_mode ?? 'realtime');
  const [airlines, setAirlines] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchAirlines(client).then(setAirlines);
  }, [client]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setRoleType(profile.role_type ?? ROLE_TYPES[0]);
    setBase(profile.base_airport ?? '');
    setAirlineId(profile.airline_id ?? undefined);
    setVisibility(profile.default_visibility ?? 'friends');
    setStatusDefaultHidden(profile.default_visibility === 'off');
    setNotificationMode(profile.notification_mode ?? 'realtime');
  }, [profile]);

  const onAvatar = async () => {
    if (!userId) return;
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    const fileId = await uploadFile({
      uri: asset.uri,
      name: 'avatar.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      bucketId: 'avatars',
    });
    await updateProfile(client, userId, { avatar_file_id: fileId });
    await refreshProfile();
  };

  const onVerificationUpload = async () => {
    if (!userId) return;
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    const fileId = await uploadFile({
      uri: asset.uri,
      name: 'crew-id.jpg',
      mimeType: asset.mimeType ?? 'image/jpeg',
      bucketId: 'verifications',
    });
    await submitVerification(client, fileId);
  };

  const onSave = async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const resolvedVisibility: VisibilityLevel = statusDefaultHidden ? 'off' : visibility;
      await updateProfile(client, userId, {
        display_name: displayName.trim(),
        role_type: roleType,
        base_airport: base.trim().toUpperCase(),
        airline_id: airlineId ?? null,
        default_visibility: resolvedVisibility,
        notification_mode: notificationMode,
      });
      await refreshProfile();
      router.back();
    } catch (e) {
      setError(formatApolloError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={{ padding: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <Pressable onPress={onAvatar} style={styles.avatarPress} accessibilityLabel="Change photo">
              <Avatar name={displayName} size="xl" />
              <View style={styles.editBadge}>
                <AppIcon name="edit" size={18} color={theme.colors.accent} />
              </View>
            </Pressable>
            <BodyText muted>{t('home.editProfilePhotoHint')}</BodyText>
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('home.editIdentity')}</SectionLabel>
            <Input label={t('onboarding.title')} value={displayName} onChangeText={setDisplayName} />
            <LabelText>{t('onboarding.role')}</LabelText>
            {ROLE_TYPES.map((role) => (
              <SelectionOption
                key={role}
                label={role.replace(/_/g, ' ')}
                selected={roleType === role}
                onPress={() => setRoleType(role)}
              />
            ))}
            <LabelText>{t('home.airline')}</LabelText>
            {airlines.map((a) => (
              <SelectionOption
                key={a.id}
                label={`${a.name} (${a.code})`}
                selected={airlineId === a.id}
                onPress={() => setAirlineId(a.id)}
              />
            ))}
            <Input label={t('onboarding.base')} value={base} onChangeText={setBase} placeholder="HKG" />
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('home.editBio')}</SectionLabel>
            <Input
              label={t('home.bioLabel')}
              value={bio}
              onChangeText={(v) => setBio(v.slice(0, BIO_MAX))}
              multiline
              placeholder={t('home.bioPlaceholder')}
            />
            <BodyText muted>
              {bio.length}/{BIO_MAX} · {t('home.bioComingSoon')}
            </BodyText>
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('home.statusDefault')}</SectionLabel>
            <SelectionOption
              label={t('home.statusAvailableDefault')}
              selected={!statusDefaultHidden}
              onPress={() => setStatusDefaultHidden(false)}
            />
            <SelectionOption
              label={t('home.statusHiddenDefault')}
              selected={statusDefaultHidden}
              onPress={() => setStatusDefaultHidden(true)}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('home.editPrivacy')}</SectionLabel>
            <Subtitle>{t('home.presencePrivacyHint')}</Subtitle>
            {VISIBILITY_LEVELS.filter((v) => v !== 'off').map((v) => (
              <SelectionOption
                key={v}
                label={v.replace(/_/g, ' ')}
                selected={!statusDefaultHidden && visibility === v}
                onPress={() => {
                  setStatusDefaultHidden(false);
                  setVisibility(v);
                }}
              />
            ))}
            <Subtitle>{t('home.notifications')}</Subtitle>
            {(['realtime', 'digest'] as const).map((mode) => (
              <SelectionOption
                key={mode}
                label={mode}
                selected={notificationMode === mode}
                onPress={() => setNotificationMode(mode)}
              />
            ))}
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('home.verification')}</SectionLabel>
            <View style={styles.verifiedRow}>
              {isVerified ? (
                <Badge label={t('verification.verified')} tone="verified" />
              ) : (
                <Badge label={t('verification.pending')} tone="status" />
              )}
            </View>
            {!isVerified ? (
              <>
                <Subtitle>{t('verification.pendingBody')}</Subtitle>
                <Button label={t('verification.uploadId')} onPress={onVerificationUpload} variant="secondary" />
              </>
            ) : (
              <BodyText muted>{t('home.verificationComplete')}</BodyText>
            )}
          </View>

          {error ? <BodyText style={{ color: theme.colors.statusOnDuty }}>{error}</BodyText> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t('home.saveChanges')} onPress={onSave} loading={loading} noTopMargin />
          <Button label={t('common.cancel')} onPress={() => router.back()} variant="ghost" noTopMargin />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
