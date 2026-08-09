import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useThemedStyles, useTheme } from '@/theme';

function formatTagLabel(tag: string): string {
  return tag
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function SelectedTagPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.xs,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accentSubtle,
      borderWidth: 1,
      borderColor: t.colors.accent,
    },
    text: {
      ...t.typography.bodySm,
      color: t.colors.accent,
    },
    remove: {
      ...t.typography.bodySm,
      color: t.colors.accent,
      lineHeight: 16,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label}`}
      onPress={onRemove}
      style={({ pressed }) => [styles.pill, { opacity: pressed ? 0.72 : 1 }]}>
      <Text style={styles.text}>{label}</Text>
      <Text style={styles.remove}>×</Text>
    </Pressable>
  );
}

function SuggestionPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    pill: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: selected ? t.colors.accent : t.colors.hairline,
      backgroundColor: selected ? t.colors.accentSubtle : t.colors.bgSurface,
    },
    text: {
      ...t.typography.bodyStrong,
      color: selected ? t.colors.accent : t.colors.textSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, { opacity: pressed ? 0.72 : 1 }]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

export function TagInputField({
  label,
  tags,
  onChangeTags,
  suggestions = [],
  placeholder,
  quickTagsLabel = 'Quick tags',
  error,
}: {
  label: string;
  tags: string[];
  onChangeTags: (tags: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
  quickTagsLabel?: string;
  error?: string;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 6 },
    field: {
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.input,
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.sm,
      backgroundColor: t.colors.bgSurface,
      minHeight: 48,
    },
    fieldFocused: { borderColor: t.colors.textPrimary },
    fieldError: { borderColor: t.colors.statusOnDuty },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: t.spacing.sm,
    },
    inlineInput: {
      ...t.typography.body,
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 120,
      paddingHorizontal: t.spacing.xs,
      paddingVertical: t.spacing.xs,
      color: t.colors.textPrimary,
    },
    quickLabel: {
      ...t.typography.bodySm,
      color: t.colors.textSecondary,
      marginTop: t.spacing.sm,
      marginBottom: t.spacing.sm,
    },
    suggestionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: t.spacing.sm,
    },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
  }));

  const addTag = (raw: string) => {
    const normalized = normalizeTag(raw);
    if (!normalized || tags.includes(normalized)) {
      setDraft('');
      return;
    }
    onChangeTags([...tags, normalized]);
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChangeTags(tags.filter((item) => item !== tag));
  };

  const toggleSuggestion = (tag: string) => {
    if (tags.includes(tag)) {
      removeTag(tag);
      return;
    }
    onChangeTags([...tags, tag]);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused ? styles.fieldFocused : null,
          error ? styles.fieldError : null,
        ]}>
        <View style={styles.pillRow}>
          {tags.map((tag) => (
            <SelectedTagPill
              key={tag}
              label={formatTagLabel(tag)}
              onRemove={() => removeTag(tag)}
            />
          ))}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => addTag(draft)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={tags.length === 0 ? placeholder : undefined}
            placeholderTextColor={theme.colors.textTertiary}
            returnKeyType="done"
            blurOnSubmit={false}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.inlineInput}
          />
        </View>
      </View>

      {suggestions.length > 0 ? (
        <>
          <Text style={styles.quickLabel}>{quickTagsLabel}</Text>
          <View style={styles.suggestionRow}>
            {suggestions.map((tag) => (
              <SuggestionPill
                key={tag}
                label={formatTagLabel(tag)}
                selected={tags.includes(tag)}
                onPress={() => toggleSuggestion(tag)}
              />
            ))}
          </View>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
