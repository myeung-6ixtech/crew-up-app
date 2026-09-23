import { useTranslation } from 'react-i18next';
import { ChoiceModal } from '@/components/ui';
import type { EventMeetType } from '@/constants/events';

type EventMeetTypeOverlayProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: EventMeetType) => void;
};

export function EventMeetTypeOverlay({
  visible,
  onClose,
  onSelect,
}: EventMeetTypeOverlayProps) {
  const { t } = useTranslation();

  return (
    <ChoiceModal<EventMeetType>
      visible={visible}
      title={t('events.meetTypeTitle')}
      onClose={onClose}
      onSelect={onSelect}
      options={[
        {
          value: 'public',
          icon: 'globe',
          title: t('events.publicMeet'),
          body: t('events.publicMeetBody'),
        },
        {
          value: 'private',
          icon: 'lock',
          title: t('events.privateMeet'),
          body: t('events.privateMeetBody'),
        },
      ]}
    />
  );
}
