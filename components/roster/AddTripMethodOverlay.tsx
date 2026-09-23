import { useTranslation } from 'react-i18next';
import { ChoiceModal } from '@/components/ui';

export type AddTripMethod = 'search' | 'roster';

type AddTripMethodOverlayProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: AddTripMethod) => void;
};

export function AddTripMethodOverlay({ visible, onClose, onSelect }: AddTripMethodOverlayProps) {
  const { t } = useTranslation();

  return (
    <ChoiceModal<AddTripMethod>
      visible={visible}
      title={t('addTripMethod.title')}
      onClose={onClose}
      onSelect={onSelect}
      options={[
        {
          value: 'search',
          icon: 'airplane',
          title: t('addTripMethod.search'),
          body: t('addTripMethod.searchBody'),
        },
        {
          value: 'roster',
          icon: 'upload',
          title: t('addTripMethod.roster'),
          body: t('addTripMethod.rosterBody'),
        },
      ]}
    />
  );
}
