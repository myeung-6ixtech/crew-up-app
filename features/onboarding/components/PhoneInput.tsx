import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import { Input } from '@/components/ui';
import { CountryPicker } from './CountryPicker';

export type PhoneValue = { e164: string | null; valid: boolean; empty: boolean };

function dialCode(code: string): string | null {
  return isSupportedCountry(code) ? `+${getCountryCallingCode(code as CountryCode)}` : null;
}

function toPhoneValue(country: string, national: string): PhoneValue {
  const trimmed = national.trim();
  if (!trimmed) return { e164: null, valid: true, empty: true };
  const parsed = isSupportedCountry(country)
    ? parsePhoneNumberFromString(trimmed, country as CountryCode)
    : parsePhoneNumberFromString(trimmed);
  return parsed?.isValid()
    ? { e164: parsed.number, valid: true, empty: false }
    : { e164: null, valid: false, empty: false };
}

type PhoneInputProps = {
  /** Current E.164 number, if any. */
  value: string | null;
  defaultCountry?: string | null;
  onChange: (value: PhoneValue) => void;
  error?: string;
};

/** Country picker + national number, normalised to E.164 with libphonenumber-js (format check only). */
export function PhoneInput({ value, defaultCountry, onChange, error }: PhoneInputProps) {
  const { t } = useTranslation();
  const existing = value ? parsePhoneNumberFromString(value) : undefined;
  const [country, setCountry] = useState<string>(existing?.country ?? defaultCountry ?? 'HK');
  const [national, setNational] = useState<string>(existing?.nationalNumber ?? '');

  useEffect(() => {
    onChange(toPhoneValue(country, national));
  }, [country, national, onChange]);

  return (
    <>
      <CountryPicker
        label={t('onboarding.phone.country')}
        value={country}
        onChange={setCountry}
        describe={dialCode}
      />
      <Input
        label={t('onboarding.phone.number')}
        value={national}
        onChangeText={setNational}
        placeholder={t('onboarding.phone.numberPlaceholder')}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        error={error}
      />
    </>
  );
}
