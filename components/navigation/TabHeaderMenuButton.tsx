import { useTranslation } from 'react-i18next';
import { TabHeaderIconButton } from '@/components/navigation/TabHeaderIconButton';
import { useAppMenu } from '@/contexts/AppMenuContext';

/** Opens the app slide-out menu from the tab header. */
export function TabHeaderMenuButton() {
  const { t } = useTranslation();
  const { open } = useAppMenu();

  return (
    <TabHeaderIconButton
      icon="menu"
      align="left"
      accessibilityLabel={t('menu.open')}
      onPress={open}
    />
  );
}
