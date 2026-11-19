import { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticSelection, hapticSuccess, hapticWarning } from '@/lib/haptics';
import { blockPerson, reportUser, unfriendPerson } from '@/services/safetyService';
import { fontFamily, useTheme } from '@/theme';

/** Stored as `reports.reason` (the admin queue uses the same keys). */
export const SAFETY_REPORT_REASONS = ['fake_profile', 'harassment', 'inappropriate', 'spam', 'safety', 'other'] as const;
type ReportReason = (typeof SAFETY_REPORT_REASONS)[number];

export type SafetyAction = 'unfriended' | 'blocked' | 'reported';
type Step = 'menu' | 'unfriend' | 'block' | 'report' | 'done';

const RED_LIGHT = '#B23A26';
const RED_DARK = '#FF7A66';

function Glyph({ kind, color }: { kind: 'unfriend' | 'report' | 'block' | 'done'; color: string }) {
  if (kind === 'unfriend')
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Circle cx={8} cy={6.5} r={3.2} stroke={color} strokeWidth={1.7} fill="none" />
        <Path d="M2 17c.6-3.2 3-5 6-5s5.4 1.8 6 5M13.5 8.5h5" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" />
      </Svg>
    );
  if (kind === 'report')
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Path d="M4.5 18V2.5M4.5 3h10l-2 3.75 2 3.75h-10" stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  if (kind === 'block')
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20">
        <Circle cx={10} cy={10} r={7.5} stroke={color} strokeWidth={1.7} fill="none" />
        <Path d="M4.8 4.8l10.4 10.4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      </Svg>
    );
  return (
    <Svg width={26} height={20} viewBox="0 0 13 10">
      <Path d="M1 5l3.6 3.6L12 1.2" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * The one sheet for every safety action on a person: the ⋯ menu (Unfriend for friends, Report, Block), a confirm step
 * for each destructive action, the report form, and a done step. Profile, chat, events and Crossing Paths all use it,
 * so copy and behaviour match. Cancel or the backdrop closes without doing anything.
 *
 * `start` opens straight on a step (e.g. a chat's Report). `report` targets a message or event instead of the person.
 */
export function SafetySheet({
  visible,
  onClose,
  person,
  isFriend = false,
  start = 'menu',
  report,
  context,
  onDone,
}: {
  visible: boolean;
  onClose: () => void;
  /** Who it's about. `name` is the first name used in the copy. */
  person: { userId: string; name: string };
  isFriend?: boolean;
  start?: 'menu' | 'report' | 'block' | 'unfriend';
  report?: { messageId?: string; eventId?: string; userId?: string | null };
  /** Saved with a report: where it was made, and the relationship then. */
  context?: { source: 'profile' | 'chat' | 'event' | 'crossing_paths'; relationship?: string; match?: string };
  /** After the done step closes (or on success, for screens that need to refresh). */
  onDone?: (action: SafetyAction) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const client = useApolloClient();
  const red = theme.mode === 'dark' ? RED_DARK : RED_LIGHT;
  const [step, setStep] = useState<Step>(start);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ action: SafetyAction; message: string } | null>(null);
  const name = person.name || t('home.crewMember');
  // Reporting a meet with no host to name (e.g. a CrewUp event) has no one to block.
  const canBlock = Boolean(person.userId);

  // Each opening starts clean.
  useEffect(() => {
    if (!visible) return;
    setStep(start);
    setReason(null);
    setNote('');
    setAlsoBlock(false);
    setBusy(false);
    setError('');
    setDone(null);
  }, [visible, start]);

  useEffect(() => {
    if (done) AccessibilityInfo.announceForAccessibility(done.message);
  }, [done]);

  const finish = (action: SafetyAction, message: string) => {
    hapticSuccess();
    setDone({ action, message });
    setStep('done');
  };

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await work();
    } catch {
      hapticError();
      setError(t('safetySheet.failed'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    const finished = done;
    onClose();
    if (finished) onDone?.(finished.action);
  };

  const unfriend = () =>
    run(async () => {
      await unfriendPerson(person.userId);
      finish('unfriended', t('safetySheet.unfriendDone'));
    });

  const block = () =>
    run(async () => {
      await blockPerson(person.userId, 'blocked_from_sheet');
      finish('blocked', t('safetySheet.blockDone', { name }));
    });

  const submitReport = () =>
    run(async () => {
      if (!reason) return;
      await reportUser(client, {
        reason,
        details: note.trim() || undefined,
        reportedUserId: report?.userId === null ? undefined : (report?.userId ?? (person.userId || undefined)),
        reportedMessageId: report?.messageId,
        reportedEventId: report?.eventId,
        context: { ...context, also_blocked: alsoBlock },
      });
      if (alsoBlock && canBlock) await blockPerson(person.userId, 'blocked_with_report');
      finish(alsoBlock ? 'blocked' : 'reported', t('safetySheet.reportDone'));
    });

  const title = (text: string) => (
    <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 22, letterSpacing: -0.4, color: theme.colors.textPrimary }}>
      {text}
    </Text>
  );
  const body = (text: string) => <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14.5, lineHeight: 21, color: theme.colors.textSecondary }}>{text}</Text>;
  const button = (label: string, onPress: () => void, tone: 'red' | 'lime' | 'plain', disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy: busy && tone !== 'plain' }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 26,
        backgroundColor: tone === 'red' ? red : tone === 'lime' ? theme.colors.fill : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
      })}>
      {busy && tone !== 'plain' ? (
        <ActivityIndicator color={tone === 'red' ? '#FFFFFF' : theme.colors.onFill} />
      ) : (
        <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: tone === 'red' ? '#FFFFFF' : tone === 'lime' ? theme.colors.onFill : theme.colors.textPrimary }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
  const errorLine = error ? (
    <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: red }}>
      {error}
    </Text>
  ) : null;

  const menu = () => {
    const rows: { key: 'unfriend' | 'report' | 'block'; label: string; sub: string; danger?: boolean }[] = [
      ...(isFriend ? [{ key: 'unfriend' as const, label: t('safetySheet.unfriend'), sub: t('safetySheet.unfriendSub', { name }) }] : []),
      { key: 'report', label: t('safetySheet.report'), sub: t('safetySheet.reportSub', { name }) },
      { key: 'block', label: t('safetySheet.block'), sub: t('safetySheet.blockSub', { name }), danger: true },
    ];
    return (
      <View style={{ gap: 4 }}>
        {rows.map((row) => (
          <Pressable
            key={row.key}
            accessibilityRole="button"
            accessibilityLabel={`${row.label}. ${row.sub}`}
            onPress={() => {
              hapticSelection();
              setStep(row.key);
            }}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 4, opacity: pressed ? 0.6 : 1 })}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
              <Glyph kind={row.key} color={row.danger ? red : theme.colors.textPrimary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fontFamily.interSemiBold, fontSize: 15.5, color: row.danger ? red : theme.colors.textPrimary }}>{row.label}</Text>
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 17, color: theme.colors.textSecondary }}>{row.sub}</Text>
            </View>
          </Pressable>
        ))}
        {button(t('common.cancel'), close, 'plain')}
      </View>
    );
  };

  const confirm = (kind: 'unfriend' | 'block') => (
    <View style={{ gap: 14 }}>
      {title(kind === 'unfriend' ? t('safetySheet.unfriendTitle', { name }) : t('safetySheet.blockTitle', { name }))}
      {body(kind === 'unfriend' ? t('safetySheet.unfriendBody', { name }) : t('safetySheet.blockBody', { name }))}
      {errorLine}
      <View style={{ gap: 4, marginTop: 6 }}>
        {button(kind === 'unfriend' ? t('safetySheet.unfriend') : t('safetySheet.block'), () => void (kind === 'unfriend' ? unfriend() : block()), 'red')}
        {button(t('common.cancel'), close, 'plain')}
      </View>
    </View>
  );

  const reportForm = () => (
    <View style={{ gap: 12 }}>
      {title(t('safetySheet.reportTitle', { name }))}
      {body(t('safetySheet.reportIntro', { name }))}
      <View accessibilityRole="radiogroup" style={{ gap: 2 }}>
        {SAFETY_REPORT_REASONS.map((key) => {
          const selected = reason === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                hapticSelection();
                setReason(key);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selected ? theme.colors.ink : theme.colors.hairline,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.ink }} /> : null}
              </View>
              <Text style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{t(`safetySheet.reasons.${key}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      {reason === 'other' ? (
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={1000}
          placeholder={t('safetySheet.notePlaceholder')}
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel={t('safetySheet.notePlaceholder')}
          style={{
            minHeight: 84,
            borderRadius: 14,
            backgroundColor: theme.colors.field,
            padding: 12,
            fontFamily: fontFamily.interRegular,
            fontSize: 14.5,
            color: theme.colors.textPrimary,
            textAlignVertical: 'top',
          }}
        />
      ) : null}
      {canBlock ? (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: alsoBlock }}
        onPress={() => {
          hapticSelection();
          setAlsoBlock((value) => !value);
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: alsoBlock ? theme.colors.ink : theme.colors.hairline,
            backgroundColor: alsoBlock ? theme.colors.ink : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {alsoBlock ? (
            <Svg width={12} height={10} viewBox="0 0 13 10">
              <Path d="M1 5l3.6 3.6L12 1.2" stroke={theme.colors.ground} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ) : null}
        </View>
        <Text style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{t('safetySheet.alsoBlock', { name })}</Text>
      </Pressable>
      ) : null}
      {errorLine}
      <View style={{ gap: 4 }}>
        {button(t('safetySheet.submitReport'), () => void submitReport(), 'lime', !reason)}
        {button(t('common.cancel'), close, 'plain')}
      </View>
    </View>
  );

  const doneStep = () => (
    <View style={{ gap: 14, alignItems: 'center', paddingTop: 6 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.accentSubtle, alignItems: 'center', justifyContent: 'center' }}>
        <Glyph kind="done" color={theme.colors.accentText} />
      </View>
      <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 20, lineHeight: 26, color: theme.colors.textPrimary, textAlign: 'center' }}>
        {done?.message}
      </Text>
      <View style={{ alignSelf: 'stretch' }}>{button(t('safetySheet.done'), close, 'lime')}</View>
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={close}>
      <View accessibilityViewIsModal style={{ paddingBottom: 8 }}>
        {step === 'menu' ? menu() : step === 'unfriend' ? confirm('unfriend') : step === 'block' ? confirm('block') : step === 'report' ? reportForm() : doneStep()}
      </View>
    </BottomSheet>
  );
}
