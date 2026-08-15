import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemedStyles, useTheme } from '@/theme';
import { createDatePickerHandlers } from '@/lib/dateTimePickerHandlers';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

function formatDateValue(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  maximumDate,
  disabled = false,
  error,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  error?: string;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md, width: '100%' },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 6 },
    field: {
      ...t.typography.body,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.input,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      backgroundColor: t.colors.bgSurface,
      minHeight: 48,
      justifyContent: 'center',
    },
    fieldFocused: { borderColor: t.colors.textPrimary },
    fieldError: { borderColor: t.colors.statusOnDuty },
    fieldDisabled: { opacity: 0.45 },
    value: { color: t.colors.textPrimary },
    placeholder: { color: t.colors.textTertiary },
    pickerSheet: { alignItems: 'center' },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
  }));

  const closePicker = () => setOpen(false);
  const pickerHandlers = createDatePickerHandlers(onChange, closePicker);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          open ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
          disabled ? styles.fieldDisabled : null,
        ]}>
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDateValue(value) : placeholder}
        </Text>
      </Pressable>

      {open && Platform.OS !== 'android' ? (
        <BottomSheet
          visible
          onClose={closePicker}
          title={label}
          scrollable={false}
          heightRatio={0.42}>
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={value ?? new Date()}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              {...pickerHandlers}
            />
            <Button label="Done" onPress={closePicker} variant="ghost" />
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
          {...pickerHandlers}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
