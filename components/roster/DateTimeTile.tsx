import { useState } from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui';
import { PillCta } from '@/features/onboarding/components/kit';
import { hapticImpact } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

export function formatShortDateTime(value: Date) {
  const date = value.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const time = value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
}

/** One filled tile holding a date and a time ("3 Oct 12:50"). iOS picks both at once; Android asks date, then time. */
export function DateTimeTile({
  label,
  value,
  onChange,
  minimumDate,
  placeholder,
  height = 50,
  style,
  invalid,
}: {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
  minimumDate?: Date;
  placeholder?: string;
  height?: number;
  style?: ViewStyle;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [step, setStep] = useState<'closed' | 'datetime' | 'date' | 'time'>('closed');
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const open = () => {
    hapticImpact();
    setDraft(value ?? minimumDate ?? new Date());
    setStep(Platform.OS === 'android' ? 'date' : 'datetime');
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ? formatShortDateTime(value) : undefined }}
        onPress={open}
        style={({ pressed }) => [
          {
            height,
            borderRadius: 12,
            backgroundColor: theme.colors.field,
            borderWidth: 2,
            borderColor: invalid ? theme.colors.statusOnDuty : theme.colors.field,
            paddingHorizontal: 12,
            justifyContent: 'center',
            gap: 1,
            opacity: pressed ? 0.8 : 1,
          },
          style,
        ]}>
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 10.5, color: theme.colors.textSecondary }}>{label}</Text>
        <Text numberOfLines={1} style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: value ? theme.colors.textPrimary : theme.colors.textTertiary }}>
          {value ? formatShortDateTime(value) : (placeholder ?? '—')}
        </Text>
      </Pressable>

      {Platform.OS !== 'android' ? (
        <BottomSheet visible={step === 'datetime'} onClose={() => setStep('closed')} scrollable={false} heightRatio={0.48}>
          <View style={{ alignItems: 'center' }}>
            <DateTimePicker
              value={draft}
              mode="datetime"
              display="spinner"
              minimumDate={minimumDate}
              themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              onValueChange={(_event, next) => setDraft(next)}
            />
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <PillCta
              label={t('onboarding.language.done')}
              onPress={() => {
                onChange(draft);
                setStep('closed');
              }}
            />
          </View>
        </BottomSheet>
      ) : null}
      {step === 'date' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onValueChange={(_event, next) => {
            setDraft(next);
            setStep('time');
          }}
          onDismiss={() => setStep('closed')}
        />
      ) : null}
      {step === 'time' ? (
        <DateTimePicker
          value={draft}
          mode="time"
          display="default"
          onValueChange={(_event, next) => {
            onChange(next);
            setStep('closed');
          }}
          onDismiss={() => setStep('closed')}
        />
      ) : null}
    </>
  );
}
