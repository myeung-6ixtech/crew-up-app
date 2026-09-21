import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { AirportPickerModal } from '@/components/roster/AirportPickerModal';
import { findAirportByIata } from '@/constants/airports';
import {
  PickerFieldShell,
  SelectionSquircle,
  usePickerFieldStyles,
} from '@/components/profile/pickerFieldShared';

type AirportPickerFieldProps = {
  label: string;
  value?: string | null;
  onChange: (iata: string) => void;
  error?: string;
  placeholder?: string;
  /** Bias search results toward this IATA code (e.g. current base). */
  preferIata?: string | null;
};

export function AirportPickerField({
  label,
  value,
  onChange,
  error,
  placeholder,
  preferIata,
}: AirportPickerFieldProps) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const styles = usePickerFieldStyles();

  const selected = useMemo(() => findAirportByIata(value), [value]);
  const placeholderText = placeholder ?? t('addTrip.selectOrigin');

  return (
    <>
      <PickerFieldShell
        label={label}
        error={error}
        onPress={() => setSheetOpen(true)}
        accessibilityHint={t('addTrip.selectOrigin')}
        placeholder={!selected}
        title={selected ? selected.city : placeholderText}
        subtitle={selected ? `${selected.name} · ${selected.country}` : null}
        leading={
          <SelectionSquircle muted={!selected}>
            <Text style={selected ? styles.squircleCode : styles.squirclePlaceholder}>
              {selected?.iata ?? '—'}
            </Text>
          </SelectionSquircle>
        }
      />

      <AirportPickerModal
        visible={sheetOpen}
        title={label}
        selectedIata={value ?? undefined}
        preferIata={preferIata ?? value ?? undefined}
        onClose={() => setSheetOpen(false)}
        onSelect={(airport) => {
          onChange(airport.iata);
          setSheetOpen(false);
        }}
      />
    </>
  );
}
