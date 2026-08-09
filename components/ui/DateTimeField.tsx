import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useThemedStyles, useTheme } from '@/theme';
import { Button } from './Button';

function formatPickerValue(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function DateTimeField({
  label,
  value,
  onChange,
  placeholder,
  minimumDate,
  error,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  minimumDate?: Date;
  error?: string;
}) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
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
    pickerWrap: { marginTop: t.spacing.sm },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
  }));

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowPicker(true)}
        style={[
          styles.field,
          showPicker ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
        ]}>
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatPickerValue(value) : placeholder}
        </Text>
      </Pressable>

      {showPicker && Platform.OS === 'ios' ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={value ?? new Date()}
            mode="datetime"
            display="spinner"
            minimumDate={minimumDate}
            onChange={onPickerChange}
            themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
          />
          <Button label="Done" onPress={() => setShowPicker(false)} variant="ghost" />
        </View>
      ) : null}

      {showPicker && Platform.OS === 'android' ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="datetime"
          display="default"
          minimumDate={minimumDate}
          onChange={onPickerChange}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
