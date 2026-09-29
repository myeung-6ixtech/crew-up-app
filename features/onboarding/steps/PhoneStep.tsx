import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApolloClient } from '@/lib/apolloHooks';
import { GET_MY_PRIVATE } from '@/graphql/queries/onboarding';
import { useAuth } from '@/hooks/useSession';
import { BodyText } from '@/components/ui';
import { PhoneInput, type PhoneValue } from '../components/PhoneInput';
import { StepScaffold } from '../components/StepScaffold';
import { useStepNavigation, useStepSave } from '../hooks/useStepForm';
import type { StepContext } from '../navigation';

export function PhoneStep({ context }: { context: StepContext }) {
  const { t } = useTranslation();
  const client = useApolloClient();
  const { profile, userId } = useAuth();
  const { save, saving, formError } = useStepSave('phone', context);
  const navigate = useStepNavigation('phone', context);
  const [existing, setExisting] = useState<string | null | undefined>(undefined);
  const [phone, setPhone] = useState<PhoneValue>({ e164: null, valid: true, empty: true });
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void client
      .query<{ user_private_by_pk: { phone_e164: string | null } | null }>({
        query: GET_MY_PRIVATE,
        variables: { userId },
        fetchPolicy: 'network-only',
      })
      .then(({ data }) => {
        if (!cancelled) setExisting(data?.user_private_by_pk?.phone_e164 ?? null);
      })
      .catch(() => {
        if (!cancelled) setExisting(null);
      });
    return () => {
      cancelled = true;
    };
  }, [client, userId]);

  const onPhoneChange = useCallback((value: PhoneValue) => {
    setPhone(value);
    setFieldError('');
  }, []);

  const onSubmit = async () => {
    if (!phone.valid) {
      setFieldError(t('onboarding.phone.invalid'));
      return;
    }
    await save({ phoneE164: phone.e164 }, (_field, message) => setFieldError(message));
  };

  const onSkip = async () => {
    if (context !== 'flow') {
      navigate();
      return;
    }
    await save({});
  };

  return (
    <StepScaffold
      step="phone"
      context={context}
      title={t('onboarding.phone.title')}
      subtitle={t('onboarding.phone.subtitle')}
      primaryLabel={context === 'flow' ? t('onboarding.next') : t('onboarding.save')}
      onPrimary={onSubmit}
      primaryLoading={saving}
      primaryDisabled={existing === undefined}
      secondaryLabel={context === 'flow' ? t('onboarding.skip') : undefined}
      onSecondary={onSkip}
      error={formError}>
      {existing === undefined ? (
        <BodyText muted>{t('common.loading')}</BodyText>
      ) : (
        <PhoneInput
          value={existing}
          defaultCountry={profile?.residence_country_code}
          onChange={onPhoneChange}
          error={fieldError || undefined}
        />
      )}
    </StepScaffold>
  );
}
