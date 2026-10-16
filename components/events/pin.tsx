import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { formatEventPin, normalizeEventPinInput } from '@/constants/events';
import { useApolloClient } from '@/lib/apolloHooks';
import { hapticError, hapticImpact, hapticSuccess } from '@/lib/haptics';
import { EventPinError, fetchEventPin, rotateEventPin, unlockEvent } from '@/services/eventService';
import { fontFamily, useTheme } from '@/theme';

export function LockGlyph({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={(size * 18) / 16} viewBox="0 0 16 18">
      <Rect x={2} y={8} width={12} height={9} rx={2} fill={color} />
      <Path d="M5 8V5.5a3 3 0 016 0V8" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

/** Lock chip on list cards and the title card of a private meet. */
export function PrivateEventBadge({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fg = tone === 'dark' ? '#EDF1F2' : theme.colors.textPrimary;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: tone === 'dark' ? '#2C3134' : theme.colors.field,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
      }}>
      <LockGlyph color={fg} size={10} />
      <MonoLabel style={{ fontSize: 10, color: fg }}>{t('eventPin.badge')}</MonoLabel>
    </View>
  );
}

function pinErrorMessage(t: (key: string, options?: Record<string, unknown>) => string, error: unknown) {
  if (!(error instanceof EventPinError)) return t('onboarding.genericError');
  if (error.code === 'EVENT_PIN_LOCKED') {
    return t('eventPin.locked', { count: Math.max(1, Math.ceil((error.retryAfterSeconds ?? 900) / 60)) });
  }
  if (error.code === 'EVENT_PIN_INVALID') {
    if (error.attemptsLeft === 0) return t('eventPin.locked', { count: 15 });
    return typeof error.attemptsLeft === 'number' ? t('eventPin.invalid', { count: error.attemptsLeft }) : t('eventPin.invalidNoCount');
  }
  if (error.code === 'EVENT_NOT_FOUND') return t('eventPin.unavailable');
  return t('onboarding.genericError');
}

/**
 * Shown instead of the meet until the PIN is entered. Accepts `k7p-q4x`, `K7P Q4X` or a pasted share message's PIN.
 * One unlock covers seeing the meet, RSVP and the chat.
 */
export function EventPinGate({ eventId, onUnlocked }: { eventId: string; onUnlocked: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const complete = pin.length === 6;

  const submit = async (value = pin) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError('');
    try {
      await unlockEvent(eventId, value);
      hapticSuccess();
      onUnlocked();
    } catch (e) {
      hapticError();
      setError(pinErrorMessage(t, e));
    } finally {
      setBusy(false);
    }
  };

  const paste = async () => {
    const text = await Clipboard.getStringAsync().catch(() => '');
    // A pasted share message ends with "PIN K7P-Q4X."; take the PIN-shaped part.
    const match = /([A-Za-z0-9]{3})[-\s]?([A-Za-z0-9]{3})(?![A-Za-z0-9])/.exec(text.split(/PIN/i).pop() ?? text);
    const next = normalizeEventPinInput(match ? `${match[1]}${match[2]}` : text);
    setPin(next);
    setError('');
    if (next.length === 6) void submit(next);
  };

  return (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 18, marginTop: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }}>
          <LockGlyph color={theme.colors.onFill} size={14} />
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>
          {t('eventPin.lockedTitle')}
        </Text>
      </View>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, lineHeight: 20, color: theme.colors.textSecondary }}>{t('eventPin.lockedBody')}</Text>
      <MonoLabel style={{ fontSize: 10.5, marginTop: 4 }}>{t('eventPin.pinLabel')}</MonoLabel>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          accessibilityLabel={t('eventPin.pinA11y')}
          value={pin.length > 3 ? formatEventPin(pin.padEnd(6, ' ')).trimEnd() : pin}
          onChangeText={(text) => {
            setPin(normalizeEventPinInput(text));
            setError('');
          }}
          onSubmitEditing={() => void submit()}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          placeholder="K7P-Q4X"
          placeholderTextColor={theme.colors.textTertiary}
          returnKeyType="go"
          style={{
            flex: 1,
            height: 52,
            borderRadius: 16,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.field,
            borderWidth: 1.5,
            borderColor: error ? '#9B2C1F' : 'transparent',
            fontFamily: fontFamily.monoMedium,
            fontSize: 20,
            letterSpacing: 3,
            color: theme.colors.textPrimary,
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => void paste()}
          style={({ pressed }) => ({
            height: 52,
            paddingHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: '#C9CEC1',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 14, color: theme.colors.textPrimary }}>{t('eventPin.paste')}</Text>
        </Pressable>
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: '#9B2C1F' }}>
          {error}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !complete, busy }}
        disabled={!complete || busy}
        onPress={() => {
          hapticImpact();
          void submit();
        }}
        style={({ pressed }) => ({
          height: 52,
          borderRadius: 26,
          marginTop: 4,
          backgroundColor: !complete ? theme.colors.track : pressed ? theme.colors.accentPressed : theme.colors.fill,
          alignItems: 'center',
          justifyContent: 'center',
        })}>
        {busy ? (
          <ActivityIndicator color={theme.colors.onFill} />
        ) : (
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: complete ? theme.colors.onFill : theme.colors.textTertiary }}>
            {t('eventPin.unlock')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function OutlineButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        height: 42,
        borderRadius: 21,
        borderWidth: 1.5,
        borderColor: '#C9CEC1',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}>
      <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13.5, color: theme.colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}

/** Host only: the PIN, with Copy, Share and Change PIN. Changing keeps everyone who already unlocked. */
export function EventPinCard({
  eventId,
  title,
  when,
  onToast,
}: {
  eventId: string;
  title: string;
  when: string;
  onToast: (message: string) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const client = useApolloClient();
  const [pin, setPin] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [rotating, setRotating] = useState(false);

  const load = useCallback(async () => {
    try {
      const row = await fetchEventPin(client, eventId);
      setPin(row?.pin ?? null);
      setFailed(!row);
    } catch {
      setFailed(true);
    }
  }, [client, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = pin ? formatEventPin(pin) : '';

  const copy = async () => {
    if (!shown) return;
    await Clipboard.setStringAsync(shown);
    hapticSuccess();
    onToast(t('eventPin.copied'));
  };

  const share = () => {
    if (!shown) return;
    void Share.share({ message: t('eventPin.shareMessage', { title, when, pin: shown }) });
  };

  const rotate = () => {
    Alert.alert(t('eventPin.changeTitle'), t('eventPin.changeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('eventPin.changeConfirm'),
        style: 'destructive',
        onPress: async () => {
          setRotating(true);
          try {
            const next = await rotateEventPin(eventId);
            setPin(next.pin);
            hapticSuccess();
            onToast(t('eventPin.changed'));
          } catch {
            hapticError();
            onToast(t('onboarding.genericError'));
          } finally {
            setRotating(false);
          }
        },
      },
    ]);
  };

  return (
    <>
      <MonoLabel style={{ fontSize: 10.5, marginTop: 20 }}>{t('eventPin.cardTitle')}</MonoLabel>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, padding: 16, marginTop: 10, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }}>
            <LockGlyph color={theme.colors.onFill} size={14} />
          </View>
          {pin ? (
            <Text
              selectable
              accessibilityLabel={pin.split('').join(' ')}
              style={{ fontFamily: fontFamily.monoMedium, fontSize: 26, letterSpacing: 4, color: theme.colors.textPrimary }}>
              {shown}
            </Text>
          ) : failed ? (
            <Text style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>{t('eventPin.loadFailed')}</Text>
          ) : (
            <ActivityIndicator color={theme.colors.accentText} />
          )}
          {rotating ? <ActivityIndicator color={theme.colors.accentText} /> : null}
        </View>
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: theme.colors.textTertiary }}>{t('eventPin.cardBody')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <OutlineButton label={t('eventPin.copy')} onPress={() => void copy()} disabled={!pin} />
          <OutlineButton label={t('eventPin.share')} onPress={share} disabled={!pin} />
          <OutlineButton label={t('eventPin.change')} onPress={rotate} disabled={!pin || rotating} />
        </View>
      </View>
    </>
  );
}
