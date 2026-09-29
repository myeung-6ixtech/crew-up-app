import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UsernameSchema } from '@crewup/shared';
import { BodySmText, Input } from '@/components/ui';
import { useTheme } from '@/theme';
import { checkUsername } from '../services/onboardingService';

export type UsernameStatus = 'idle' | 'checking' | 'available' | 'unavailable';

const DEBOUNCE_MS = 400;

type UsernameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  onStatusChange?: (status: UsernameStatus) => void;
};

/** Username input with format validation (shared schema) and a debounced server availability check. */
export function UsernameField({ value, onChange, onBlur, error, onStatusChange }: UsernameFieldProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    const parsed = UsernameSchema.safeParse(value);
    if (!parsed.success) {
      setStatus('idle');
      setMessage('');
      return undefined;
    }
    const controller = new AbortController();
    setStatus('checking');
    const timer = setTimeout(() => {
      checkUsername(parsed.data, controller.signal)
        .then((result) => {
          if (result.available) {
            setStatus('available');
            setMessage(t('onboarding.nameHandle.usernameAvailable'));
          } else {
            setStatus('unavailable');
            setMessage(
              result.reason === 'taken'
                ? t('onboarding.nameHandle.usernameTaken')
                : result.reason === 'reserved'
                  ? t('onboarding.nameHandle.usernameReserved')
                  : result.message,
            );
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) setStatus('idle');
        });
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [t, value]);

  const helper = error ?? (status === 'unavailable' ? message : undefined);

  return (
    <>
      <Input
        label={t('onboarding.nameHandle.username')}
        value={value}
        onChangeText={(text) => onChange(text.toLowerCase().replace(/\s/g, ''))}
        onBlur={onBlur}
        placeholder={t('onboarding.nameHandle.usernamePlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        maxLength={20}
        error={helper}
      />
      <UsernameHint status={status} message={message} hasError={Boolean(helper)} />
    </>
  );
}

function UsernameHint({ status, message, hasError }: { status: UsernameStatus; message: string; hasError: boolean }) {
  const { t } = useTranslation();
  if (hasError) return null;
  const text =
    status === 'checking'
      ? t('onboarding.nameHandle.usernameChecking')
      :     status === 'available'
        ? message
        : t('onboarding.nameHandle.usernameHint');
  return <UsernameHelperText text={text} positive={status === 'available'} />;
}

function UsernameHelperText({ text, positive }: { text: string; positive: boolean }) {
  const theme = useTheme();
  return (
    <BodySmText
      style={{
        marginTop: -theme.spacing.sm,
        marginBottom: theme.spacing.md,
        color: positive ? theme.colors.accentText : theme.colors.textSecondary,
      }}>
      {text}
    </BodySmText>
  );
}
