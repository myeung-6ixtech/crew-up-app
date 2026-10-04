import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui';
import { FilledPressField, PillCta } from '@/features/onboarding/components/kit';
import { createDatePickerHandlers } from '@/lib/dateTimePickerHandlers';
import { useTheme } from '@/theme';

type Mode = 'date' | 'time';

/** Date and time as two filled tiles side by side, each opening the native picker. */
export function WhenTiles({
  date,
  time,
  onDateChange,
  onTimeChange,
  minimumDate,
  error,
  dateLabel,
  timeLabel,
  dateFormat = { weekday: 'short', day: 'numeric', month: 'short' },
  hour12,
}: {
  date: Date | null;
  time: Date | null;
  onDateChange: (date: Date) => void;
  onTimeChange: (time: Date) => void;
  minimumDate?: Date;
  error?: string;
  dateLabel?: string;
  timeLabel?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
  /** false for airport clocks (07:45); defaults to the device setting. */
  hour12?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState<Mode | null>(null);
  const modeRef = useRef<Mode>('date');
  if (open) modeRef.current = open;
  const pickerMode = open ?? modeRef.current;
  const close = () => setOpen(null);
  const value = pickerMode === 'time' ? time : date;
  const onChange = pickerMode === 'time' ? onTimeChange : onDateChange;
  const handlers = createDatePickerHandlers(onChange, close);

  return (
    <>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <FilledPressField
          style={{ flex: 1, marginBottom: 0 }}
          chevron={false}
          label={dateLabel ?? t('events.date')}
          value={date ? date.toLocaleDateString(undefined, dateFormat) : null}
          placeholder={t('events.selectDate')}
          error={error ? ' ' : undefined}
          onPress={() => setOpen('date')}
        />
        <FilledPressField
          style={{ flex: 1, marginBottom: 0 }}
          chevron={false}
          label={timeLabel ?? t('events.startTime')}
          value={time ? time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12 }) : null}
          placeholder={t('events.selectTime')}
          error={error ? ' ' : undefined}
          onPress={() => setOpen('time')}
        />
      </View>

      {Platform.OS !== 'android' ? (
        <BottomSheet visible={open !== null} onClose={close} scrollable={false} heightRatio={0.46}>
          <View style={{ alignItems: 'center' }}>
            <DateTimePicker
              value={value ?? new Date()}
              mode={pickerMode}
              display="spinner"
              minimumDate={pickerMode === 'date' ? minimumDate : undefined}
              themeVariant={theme.mode === 'dark' ? 'dark' : 'light'}
              {...handlers}
            />
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <PillCta
              label={t('onboarding.language.done')}
              onPress={() => {
                if (!value) onChange(new Date());
                close();
              }}
            />
          </View>
        </BottomSheet>
      ) : null}
      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode={open}
          display="default"
          minimumDate={open === 'date' ? minimumDate : undefined}
          {...handlers}
        />
      ) : null}
    </>
  );
}
