import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { ChoiceSheet } from '@/components/crew/ChoiceSheet';
import type { EventMeetType } from '@/constants/events';
import { useTheme } from '@/theme';

type EventMeetTypeOverlayProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: EventMeetType) => void;
};

function GlobeGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function LockGlyph({ color }: { color: string }) {
  return (
    <Svg width={20} height={22} viewBox="0 0 16 18">
      <Rect x={2} y={8} width={12} height={9} rx={2} fill={color} />
      <Path d="M5 8V5.5a3 3 0 016 0V8" stroke={color} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

/** What kind of meet? Choosing opens the create form with that visibility filled in; closing stays put. */
export function EventMeetTypeOverlay({ visible, onClose, onSelect }: EventMeetTypeOverlayProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <ChoiceSheet<EventMeetType>
      visible={visible}
      title={t('events.meetTypeTitle')}
      onClose={onClose}
      onSelect={onSelect}
      options={[
        {
          value: 'public',
          title: t('events.publicMeet'),
          body: t('events.publicMeetBody'),
          note: t('events.publicMeetNote'),
          icon: <GlobeGlyph color={theme.colors.onFill} />,
        },
        {
          value: 'private',
          title: t('events.privateMeet'),
          body: t('events.privateMeetBody'),
          note: t('events.privateMeetNote'),
          icon: <LockGlyph color={theme.colors.onFill} />,
        },
      ]}
    />
  );
}
