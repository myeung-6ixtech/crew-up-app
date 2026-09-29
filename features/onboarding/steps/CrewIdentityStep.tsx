import { useEffect, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CREW_ROLES, CrewIdentitySchema, type CrewRole } from '@crewup/shared';
import { AirlinePickerField, type AirlineOption } from '@/components/profile/AirlinePickerField';
import { AirportPickerField } from '@/components/profile/AirportPickerField';
import { BodySmText, BodyText, PillSelectorGroup } from '@/components/ui';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatApolloError } from '@/lib/graphqlError';
import { useAuth } from '@/hooks/useSession';
import { fetchAirlines } from '@/services/profileService';
import { useTheme } from '@/theme';
import { StepScaffold } from '../components/StepScaffold';
import { useStepForm } from '../hooks/useStepForm';
import type { StepContext } from '../navigation';

export function CrewIdentityStep({ context }: { context: StepContext }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const client = useApolloClient();
  const { profile } = useAuth();
  const [airlines, setAirlines] = useState<AirlineOption[]>([]);
  const [airlinesLoading, setAirlinesLoading] = useState(true);
  const [airlinesError, setAirlinesError] = useState('');

  const { form, submit, saving, formError } = useStepForm(
    'crew',
    CrewIdentitySchema,
    {
      crewRole: profile?.crew_role ?? undefined,
      airlineId: profile?.airline_id ?? '',
      baseAirportIata: profile?.base_airport_iata ?? profile?.base_airport ?? '',
    },
    context,
  );
  const { control } = form;

  useEffect(() => {
    let cancelled = false;
    void fetchAirlines(client)
      .then((rows) => {
        if (!cancelled) setAirlines(rows);
      })
      .catch((error) => {
        if (!cancelled) setAirlinesError(formatApolloError(error));
      })
      .finally(() => {
        if (!cancelled) setAirlinesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <StepScaffold
      step="crew"
      context={context}
      title={t('onboarding.crew.title')}
      subtitle={t('onboarding.crew.subtitle')}
      primaryLabel={context === 'flow' ? t('onboarding.next') : t('onboarding.save')}
      onPrimary={submit}
      primaryLoading={saving}
      error={formError}>
      <Controller
        control={control}
        name="crewRole"
        render={({ field, fieldState }) => (
          <>
            <PillSelectorGroup<CrewRole>
              label={t('onboarding.crew.role')}
              options={CREW_ROLES.map((role) => ({ value: role, label: t(`onboarding.crewRoles.${role}`) }))}
              value={field.value}
              onChange={field.onChange}
            />
            {fieldState.error ? (
              <BodySmText style={{ color: theme.colors.statusOnDuty, marginTop: -theme.spacing.sm, marginBottom: theme.spacing.md }}>
                {fieldState.error.message}
              </BodySmText>
            ) : null}
          </>
        )}
      />
      <Controller
        control={control}
        name="airlineId"
        render={({ field, fieldState }) => (
          <AirlinePickerField
            label={t('onboarding.crew.airline')}
            airlines={airlines}
            value={field.value || undefined}
            onChange={(id) => field.onChange(id ?? '')}
            loading={airlinesLoading}
            error={airlinesError || fieldState.error?.message}
          />
        )}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => Alert.alert(t('onboarding.crew.airlineMissing'), t('onboarding.crew.airlineMissingBody'))}
        style={{ marginTop: -theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        <BodyText style={{ color: theme.colors.accentText }}>{t('onboarding.crew.airlineMissing')}</BodyText>
      </Pressable>
      <Controller
        control={control}
        name="baseAirportIata"
        render={({ field, fieldState }) => (
          <AirportPickerField
            label={t('onboarding.crew.base')}
            value={field.value}
            onChange={field.onChange}
            placeholder={t('onboarding.crew.baseHint')}
            preferIata={profile?.base_airport_iata}
            error={fieldState.error?.message}
          />
        )}
      />
    </StepScaffold>
  );
}
