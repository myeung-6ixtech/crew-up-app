import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar, BodyText, Button, HeadlineText } from '@/components/ui';
import { findAirportByIata } from '@/constants/airports';
import { SCREENS } from '@/constants/screens';
import { useAuth, useSession } from '@/hooks/useSession';
import { useTheme, useThemedStyles } from '@/theme';
import { StepScaffold } from '../../components/StepScaffold';
import { useOnboardingState } from '../../hooks/useOnboardingState';

/** Beta ending 2: "You're on the list". No social surfaces; profile edits allowed. */
export function BetaHoldingScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuth();
  const { signOut } = useSession();
  const { retryMode, refresh } = useOnboardingState();
  const [checking, setChecking] = useState(false);
  const styles = useThemedStyles((th) => ({
    card: {
      alignItems: 'center',
      gap: th.spacing.xs,
      padding: th.spacing.lg,
      borderRadius: th.radius.input,
      borderWidth: 1,
      borderColor: th.colors.hairline,
      backgroundColor: th.colors.bgSurface,
      marginBottom: th.spacing.lg,
    },
  }));

  const name = profile?.preferred_name || profile?.full_name || '';
  const airport = findAirportByIata(profile?.base_airport_iata);
  const detail = [
    profile?.crew_role ? t(`onboarding.crewRoles.${profile.crew_role}`) : null,
    airport ? `${airport.iata} · ${airport.city}` : profile?.base_airport_iata,
  ]
    .filter(Boolean)
    .join(' · ');

  const checkAgain = async () => {
    setChecking(true);
    try {
      await Promise.all([retryMode(), refresh()]);
    } finally {
      setChecking(false);
    }
  };

  return (
    <StepScaffold
      context="flow"
      hideBack
      title={t('onboarding.betaHolding.title', { name })}
      subtitle={t('onboarding.betaHolding.subtitle')}
      primaryLabel={t('onboarding.betaHolding.editProfile')}
      onPrimary={() => router.push(SCREENS.profile.edit)}
      secondaryLabel={t('onboarding.betaHolding.checkAgain')}
      onSecondary={() => void checkAgain()}
      primaryLoading={checking}>
      <View style={styles.card}>
        <Avatar name={name} fileId={profile?.avatar_file_id} size="xl" />
        <HeadlineText style={{ marginTop: theme.spacing.sm }}>{name}</HeadlineText>
        {profile?.username ? <BodyText muted>@{profile.username}</BodyText> : null}
        {detail ? <BodyText muted>{detail}</BodyText> : null}
      </View>
      <Button label={t('onboarding.signOut')} variant="ghost" onPress={() => void signOut()} />
    </StepScaffold>
  );
}
