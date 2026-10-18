import { useTranslation } from 'react-i18next';
import { RadioRow, SettingsPage, SettingsSection } from '@/components/settings/settingsKit';
import { useThemeControls } from '@/theme';
import type { ThemePreference } from '@/theme/ThemeProvider';

const OPTIONS: ThemePreference[] = ['light', 'dark', 'system'];

/** 6D — Light, Dark or Match device. Applies across the app straight away. */
export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { preference, setColorScheme } = useThemeControls();
  return (
    <SettingsPage title={t('settings.appearance')} subtitle={t('settings.appearanceIntro')}>
      <SettingsSection>
        {OPTIONS.map((option) => (
          <RadioRow
            key={option}
            minHeight={64}
            label={t(`settings.theme.${option}`)}
            detail={t(`settings.themeSub.${option}`)}
            selected={preference === option}
            onPress={() => setColorScheme(option)}
          />
        ))}
      </SettingsSection>
    </SettingsPage>
  );
}
