import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { AppIcon } from '@/components/icons';
import { useThemedStyles, useTheme } from '@/theme';

export function SearchInputField({
  value,
  onChangeText,
  onSearch,
  placeholder,
  label,
  error,
  loading = false,
  containerStyle,
  ...textInputProps
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  label?: string;
  error?: string;
  loading?: boolean;
  containerStyle?: object;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'>) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 6 },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.input,
      backgroundColor: t.colors.bgSurface,
      minHeight: 48,
      paddingLeft: t.spacing.md,
      paddingRight: t.spacing.xs,
    },
    fieldFocused: { borderColor: t.colors.textPrimary },
    fieldError: { borderColor: t.colors.statusOnDuty },
    input: {
      ...t.typography.body,
      flex: 1,
      color: t.colors.textPrimary,
      paddingVertical: t.spacing.md,
      paddingRight: t.spacing.sm,
    },
    action: {
      minWidth: 40,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.pill,
    },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
  }));

  const submit = () => {
    onSearch?.();
  };

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={submit}
          style={styles.input}
          {...textInputProps}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={placeholder ?? 'Search'}
          disabled={loading}
          onPress={submit}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.72 : 1 }]}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.accentText} />
          ) : (
            <AppIcon name="search" size={20} color={theme.colors.textSecondary} />
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
