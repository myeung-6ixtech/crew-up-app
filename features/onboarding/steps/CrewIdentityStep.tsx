import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CREW_ROLES, CrewIdentitySchema, type CrewRole } from '@crewup/shared';
import { AirlinePickerField, type AirlineOption } from '@/components/profile/AirlinePickerField';
import { AirportPickerField } from '@/components/profile/AirportPickerField';
import { useApolloClient } from '@/lib/apolloHooks';
import { formatApolloError } from '@/lib/graphqlError';
import { useAuth } from '@/hooks/useSession';
import { fetchAirlines } from '@/services/profileService';
import { fontFamily, useTheme } from '@/theme';
import { ChoicePill, MonoLabel } from '../components/kit';
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
      <MonoLabel>{t('onboarding.crew.role')}</MonoLabel>
      <Controller
        control={control}
        name="crewRole"
        render={({ field, fieldState }) => (
          <>
            <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {CREW_ROLES.map((role: CrewRole) => (
                <ChoicePill
                  key={role}
                  label={t(`onboarding.crewRoles.${role}`)}
                  selected={field.value === role}
                  onPress={() => field.onChange(role)}
                  style={{ flexBasis: '48%', flexGrow: 1 }}
                />
              ))}
            </View>
            {fieldState.error ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.statusOnDuty, marginTop: 6, paddingLeft: 4 }}>
                {fieldState.error.message}
              </Text>
            ) : null}
          </>
        )}
      />
      <MonoLabel style={{ marginTop: 26, marginBottom: 10 }}>{t('onboarding.crew.airlineAndBase')}</MonoLabel>
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
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 19, color: theme.colors.textSecondary, marginTop: 2 }}>
        {t('onboarding.crew.airlineMissingLead')}{' '}
        <Text
          accessibilityRole="link"
          onPress={() => Alert.alert(t('onboarding.crew.airlineMissing'), t('onboarding.crew.airlineMissingBody'))}
          style={{ fontFamily: fontFamily.interMedium, color: theme.colors.accentText }}>
          {t('onboarding.crew.contactSupport')}
        </Text>{' '}
        {t('onboarding.crew.airlineMissingTail')}
      </Text>
    </StepScaffold>
  );
}
