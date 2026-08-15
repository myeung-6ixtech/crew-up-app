import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { NumericText, BottomSheet, Button } from '@/components/ui';
import { useThemedStyles, useTheme } from '@/theme';

function formatDatePrimary(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateSecondary(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
  });
}

export function FlightDateSelector({
  value,
  onChange,
  placeholder,
  minimumDate,
  maximumDate,
  disabled = false,
  active = false,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  active?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => value ?? new Date());
  const styles = useThemedStyles((t) => ({
    card: {
      width: '100%',
      minHeight: 112,
      borderRadius: t.radius.card,
      borderWidth: 1,
      borderColor: active || open ? t.colors.accent : t.colors.hairline,
      backgroundColor: active || open ? t.colors.accentSubtle : t.colors.bgSurfaceRaised,
      paddingVertical: t.spacing.lg,
      paddingHorizontal: t.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.xs,
    },
    cardDisabled: { opacity: 0.45 },
    primary: {
      ...t.typography.numericLg,
      color: t.colors.textPrimary,
      textAlign: 'center',
    },
    secondary: {
      ...t.typography.bodySm,
      color: t.colors.textSecondary,
      textAlign: 'center',
    },
    placeholder: {
      ...t.typography.bodyStrong,
      color: t.colors.textTertiary,
      textAlign: 'center',
    },
    pickerSheet: { alignItems: 'center' },
  }));

  const closePicker = () => setOpen(false);
  const openPicker = () => {
    setDraftDate(value ?? new Date());
    setOpen(true);
  };

  // Every flight search costs metered API quota, so the date is published to the
  // parent exactly once per picker session rather than on each spinner movement.
  const confirmPicker = (date: Date) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.card,
          disabled ? styles.cardDisabled : null,
          { opacity: pressed && !disabled ? 0.82 : 1 },
        ]}>
        {value ? (
          <>
            <NumericText style={styles.primary}>{formatDatePrimary(value)}</NumericText>
            <Text style={styles.secondary}>{formatDateSecondary(value)}</Text>
          </>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
      </Pressable>

      {open && Platform.OS !== 'android' ? (
        <BottomSheet
          visible
          onClose={() => setOpen(false)}
          title={placeholder}
          scrollable={false}
          heightRatio={0.42}>
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              onValueChange={(_event: DateTimePickerChangeEvent, date: Date) => {
                setDraftDate(date);
              }}
            />
            <Button label="Done" onPress={() => confirmPicker(draftDate)} variant="ghost" />
          </View>
        </BottomSheet>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_event: DateTimePickerChangeEvent, date: Date) => {
            confirmPicker(date);
          }}
          onDismiss={closePicker}
        />
      ) : null}
    </>
  );
}
