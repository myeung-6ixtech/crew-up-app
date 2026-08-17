import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/icons';
import { BodyText, BottomSheet } from '@/components/ui';
import type { Activity } from '@/types/domain';
import { useThemedStyles, useTheme } from '@/theme';

type ActivityPickerFieldProps = {
  label: string;
  activities: Activity[];
  value: string[];
  onChange: (activityIds: string[]) => void;
  loading?: boolean;
  error?: string;
};

function formatCategoryLabel(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' & ');
}

export function ActivityPickerField({
  label,
  activities,
  value,
  onChange,
  loading = false,
  error,
}: ActivityPickerFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftSelection, setDraftSelection] = useState<string[]>(value);

  const selectedActivities = useMemo(
    () => activities.filter((activity) => value.includes(activity.id)),
    [activities, value],
  );

  const styles = useThemedStyles((t) => ({
    wrap: { marginBottom: t.spacing.md },
    label: { ...t.typography.bodyStrong, color: t.colors.textPrimary, marginBottom: 6 },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.input,
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      backgroundColor: t.colors.bgSurface,
      minHeight: 48,
      gap: t.spacing.sm,
    },
    fieldFocused: { borderColor: t.colors.textPrimary },
    fieldError: { borderColor: t.colors.statusOnDuty },
    fieldDisabled: { opacity: 0.6 },
    fieldText: {
      ...t.typography.body,
      color: t.colors.textPrimary,
      flex: 1,
    },
    placeholder: {
      color: t.colors.textTertiary,
    },
    error: { ...t.typography.bodySm, color: t.colors.statusOnDuty, marginTop: t.spacing.xs },
    list: { flex: 1, marginTop: t.spacing.sm },
    row: {
      paddingVertical: t.spacing.sm + 2,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.input,
      marginBottom: t.spacing.xs,
    },
    rowSelected: {
      backgroundColor: t.colors.accentSubtle,
    },
    rowTitle: {
      ...t.typography.bodyStrong,
      color: t.colors.textPrimary,
    },
    rowTitleSelected: {
      color: t.colors.accent,
    },
    rowMeta: {
      marginTop: 2,
    },
    empty: {
      paddingVertical: t.spacing.xl,
      alignItems: 'center',
    },
  }));

  const openSheet = () => {
    setDraftSelection(value);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    onChange(draftSelection);
    setSheetOpen(false);
  };

  const toggleActivity = (activityId: string) => {
    setDraftSelection((current) =>
      current.includes(activityId)
        ? current.filter((id) => id !== activityId)
        : [...current, activityId],
    );
  };

  const displayText =
    selectedActivities.length > 0
      ? selectedActivities.map((activity) => activity.name).join(', ')
      : t('events.selectActivity');

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={t('events.selectActivity')}
          disabled={loading}
          onPress={openSheet}
          style={({ pressed }) => [
            styles.field,
            sheetOpen ? styles.fieldFocused : null,
            error ? styles.fieldError : null,
            loading ? styles.fieldDisabled : null,
            { opacity: pressed ? 0.72 : 1 },
          ]}>
          <Text
            style={[
              styles.fieldText,
              selectedActivities.length === 0 ? styles.placeholder : null,
            ]}
            numberOfLines={2}>
            {loading ? t('common.loading') : displayText}
          </Text>
          <AppIcon name="chevronDown" size={20} color={theme.colors.textTertiary} />
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <BottomSheet
        visible={sheetOpen}
        onClose={closeSheet}
        title={label}
        scrollable={false}
        heightRatio={0.9}>
        <FlatList
          style={styles.list}
          data={activities}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          ListEmptyComponent={
            <View style={styles.empty}>
              <BodyText muted style={{ textAlign: 'center' }}>
                {t('events.noActivities')}
              </BodyText>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = draftSelection.includes(item.id);
            return (
              <Pressable
                onPress={() => toggleActivity(item.id)}
                style={({ pressed }) => [
                  styles.row,
                  isSelected ? styles.rowSelected : null,
                  { opacity: pressed ? 0.82 : 1 },
                ]}>
                <Text style={[styles.rowTitle, isSelected ? styles.rowTitleSelected : null]}>
                  {item.name}
                </Text>
                <BodyText muted numberOfLines={1} style={styles.rowMeta}>
                  {formatCategoryLabel(item.category)}
                </BodyText>
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </>
  );
}
