import { useState } from 'react';
import { View, TextInput, Text, type TextInputProps } from 'react-native';
import { useThemedStyles, useTheme } from '@/theme';

export function Input({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  multiline,
  error,
  hint,
  onFocus,
  onBlur,
  style,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  placeholder?: string;
  multiline?: boolean;
  error?: string;
  hint?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 6 },
    input: {
      ...t.typography.body,
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.input,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      backgroundColor: t.colors.bgSurface,
      color: t.colors.textPrimary,
      minHeight: multiline ? 88 : undefined,
      textAlignVertical: multiline ? ('top' as const) : ('center' as const),
    },
    inputFocused: { borderColor: t.colors.textPrimary },
    inputError: { borderColor: t.colors.statusOnDuty },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
    hint: { ...t.typography.bodySm, color: t.colors.textTertiary, marginTop: t.spacing.xs },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={theme.colors.textTertiary}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
