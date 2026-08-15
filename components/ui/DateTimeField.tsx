import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemedStyles, useTheme } from '@/theme';
import { createDatePickerHandlers } from '@/lib/dateTimePickerHandlers';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

type PickerMode = 'date' | 'time';
type ActivePicker = PickerMode | null;

function formatDateValue(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeValue(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function PickerField({
  label,
  value,
  placeholder,
  focused,
  error,
  onPress,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  focused: boolean;
  error?: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    wrap: { flex: 1 },
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
    value: { color: t.colors.textPrimary },
    placeholder: { color: t.colors.textTertiary },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={[
          styles.field,
          focused ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
        ]}>
        <Text style={value ? styles.value : styles.placeholder}>{value ?? placeholder}</Text>
      </Pressable>
    </View>
  );
}

export function combineDateAndTime(date: Date, time: Date): Date {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

export function DateTimeField({
  dateLabel,
  timeLabel,
  date,
  time,
  onDateChange,
  onTimeChange,
  datePlaceholder,
  timePlaceholder,
  minimumDate,
  error,
}: {
  dateLabel: string;
  timeLabel: string;
  date: Date | null;
  time: Date | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
  datePlaceholder: string;
  timePlaceholder: string;
  minimumDate?: Date;
  error?: string;
}) {
  const theme = useTheme();
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    row: {
      flexDirection: 'row',
      gap: t.spacing.md,
    },
    pickerSheet: {
      alignItems: 'center',
    },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
  }));

  const pickerValue =
    activePicker === 'date' ? (date ?? new Date()) : (time ?? new Date());
  const showError = Boolean(error);
  const overlayPicker = Platform.OS !== 'android';

  const closePicker = () => setActivePicker(null);

  const pickerHandlers = createDatePickerHandlers((selectedDate) => {
    if (activePicker === 'date') {
      onDateChange(selectedDate);
    } else if (activePicker === 'time') {
      onTimeChange(selectedDate);
    }
  }, closePicker);

  const pickerTitle = activePicker === 'date' ? dateLabel : timeLabel;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <PickerField
          label={dateLabel}
          value={date ? formatDateValue(date) : null}
          placeholder={datePlaceholder}
          focused={activePicker === 'date'}
          error={showError}
          onPress={() => setActivePicker('date')}
        />
        <PickerField
          label={timeLabel}
          value={time ? formatTimeValue(time) : null}
          placeholder={timePlaceholder}
          focused={activePicker === 'time'}
          error={showError}
          onPress={() => setActivePicker('time')}
        />
      </View>

      {overlayPicker && activePicker ? (
        <BottomSheet
          visible
          onClose={closePicker}
          title={pickerTitle}
          scrollable={false}
          heightRatio={0.42}>
          <View style={styles.pickerSheet}>
            <DateTimePicker
              value={pickerValue}
              mode={activePicker}
              display="spinner"
              minimumDate={activePicker === 'date' ? minimumDate : undefined}
              themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              {...pickerHandlers}
            />
            <Button label="Done" onPress={closePicker} variant="ghost" />
          </View>
        </BottomSheet>
      ) : null}

      {activePicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={pickerValue}
          mode={activePicker}
          display="default"
          minimumDate={activePicker === 'date' ? minimumDate : undefined}
          {...pickerHandlers}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
