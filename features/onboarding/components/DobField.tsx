import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { DatePicker } from '@quidone/react-native-wheel-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui';
import { createDatePickerHandlers } from '@/lib/dateTimePickerHandlers';
import { hapticImpact } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import { PillCta } from './kit';

const pad = (value: number) => String(value).padStart(2, '0');

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromIsoDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Local noon. The wheel parses date strings with `new Date`, which treats YYYY-MM-DD as UTC. */
function toPickerDate(date: Date): string {
  return `${toIsoDate(date)}T12:00:00`;
}

/** Day / Month / Year tiles. iOS opens the system wheel; Android scrolls wheels in the same sheet. */
export function DobField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
  error,
}: {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const handlers = createDatePickerHandlers(onChange, close);
  const initial = value ?? maximumDate ?? new Date();

  const tiles = [
    { key: 'day', label: t('onboarding.about.day'), value: value ? pad(value.getDate()) : '—', flex: 1 },
    { key: 'month', label: t('onboarding.about.month'), value: value ? pad(value.getMonth() + 1) : '—', flex: 1 },
    { key: 'year', label: t('onboarding.about.year'), value: value ? String(value.getFullYear()) : '—', flex: 1.4 },
  ];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ? value.toLocaleDateString() : undefined }}
        onPress={() => {
          hapticImpact();
          setOpen(true);
        }}
        style={({ pressed }) => ({ flexDirection: 'row', gap: 8, opacity: pressed ? 0.8 : 1 })}>
        {tiles.map((tile) => (
          <View
            key={tile.key}
            style={{
              flex: tile.flex,
              height: 64,
              borderRadius: 14,
              backgroundColor: theme.colors.field,
              borderWidth: 2,
              borderColor: error ? theme.colors.statusOnDuty : open ? theme.colors.ink : theme.colors.field,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 11, color: theme.colors.textTertiary }}>
              {tile.label}
            </Text>
            <Text
              style={{
                fontFamily: fontFamily.jakartaBold,
                fontSize: 20,
                color: value ? theme.colors.textPrimary : theme.colors.textTertiary,
              }}>
              {tile.value}
            </Text>
          </View>
        ))}
      </Pressable>
      {error ? (
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.statusOnDuty, marginTop: 6, paddingLeft: 4 }}>
          {error}
        </Text>
      ) : null}

      {Platform.OS !== 'android' ? (
        <BottomSheet visible={open} onClose={close} title={label} scrollable={false} heightRatio={0.46}>
          <View style={{ alignItems: 'center' }}>
            <DateTimePicker
              value={initial}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              {...handlers}
            />
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <PillCta
              label={t('onboarding.language.done')}
              onPress={() => {
                if (!value) onChange(initial);
                close();
              }}
            />
          </View>
        </BottomSheet>
      ) : null}

      {Platform.OS === 'android' ? (
        <BottomSheet visible={open} onClose={close} title={label} scrollable={false} heightRatio={0.52}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <DatePicker
              date={toPickerDate(initial)}
              minDate={minimumDate ? toPickerDate(minimumDate) : undefined}
              maxDate={maximumDate ? toPickerDate(maximumDate) : undefined}
              locale={getLocales()[0]?.languageTag ?? 'en'}
              onDateChanged={({ date }) => onChange(fromIsoDate(date))}
              itemHeight={44}
              visibleItemCount={5}
              enableScrollByTapOnItem
              itemTextStyle={{
                fontFamily: fontFamily.jakartaMedium,
                fontSize: 20,
                color: theme.colors.textPrimary,
              }}
              overlayItemStyle={{ backgroundColor: theme.colors.ink, opacity: 0.08 }}
              renderDate={() => <DatePicker.Date width={64} />}
              renderMonth={() => <DatePicker.Month width={148} />}
              renderYear={() => <DatePicker.Year width={88} />}
            />
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <PillCta
              label={t('onboarding.language.done')}
              onPress={() => {
                if (!value) onChange(initial);
                close();
              }}
            />
          </View>
        </BottomSheet>
      ) : null}
    </>
  );
}
