import { useTranslation } from 'react-i18next';
import { ChoiceSheet } from '@/components/crew/ChoiceSheet';
import { PlaneGlyph, UploadGlyph } from '@/components/roster/flowKit';
import { useTheme } from '@/theme';

export type AddTripMethod = 'search' | 'roster';

type AddTripMethodOverlayProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: AddTripMethod) => void;
};

/** Which method? Search one flight, or upload a roster for a month of layovers. */
export function AddTripMethodOverlay({ visible, onClose, onSelect }: AddTripMethodOverlayProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <ChoiceSheet<AddTripMethod>
      visible={visible}
      title={t('addTripMethod.title')}
      onClose={onClose}
      onSelect={onSelect}
      options={[
        { value: 'search', title: t('addTripMethod.search'), body: t('addTripMethod.searchBody'), icon: <PlaneGlyph color={theme.colors.onFill} /> },
        { value: 'roster', title: t('addTripMethod.roster'), body: t('addTripMethod.rosterBody'), icon: <UploadGlyph color={theme.colors.onFill} /> },
      ]}
    />
  );
}
