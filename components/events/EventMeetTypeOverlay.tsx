import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '@/components/icons';
import { BodyText, DisplaySmText } from '@/components/ui';
import type { EventMeetType } from '@/constants/events';
import { useThemedStyles, useTheme } from '@/theme';

type EventMeetTypeOverlayProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: EventMeetType) => void;
};

function MeetTypeOption({
  icon,
  title,
  body,
  onPress,
}: {
  icon: AppIconName;
  title: string;
  body: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const styles = useThemedStyles((t) => ({
    option: {
      borderWidth: 1,
      borderColor: t.colors.hairline,
      borderRadius: t.radius.card,
      padding: t.spacing.md,
      marginBottom: t.spacing.md,
      backgroundColor: t.colors.bgCanvas,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: t.spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.accentSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      flex: 1,
    },
    title: {
      marginBottom: t.spacing.xs,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.option, { opacity: pressed ? 0.82 : 1 }]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <AppIcon name={icon} size={20} color={theme.colors.accent} />
        </View>
        <View style={styles.copy}>
          <BodyText strong style={styles.title}>
            {title}
          </BodyText>
          <BodyText muted>{body}</BodyText>
        </View>
      </View>
    </Pressable>
  );
}

export function EventMeetTypeOverlay({
  visible,
  onClose,
  onSelect,
}: EventMeetTypeOverlayProps) {
  const { t } = useTranslation();

  const styles = useThemedStyles((t) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(16, 17, 20, 0.68)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: t.spacing.lg,
    },
    cardWrap: {
      width: '100%',
      maxWidth: 420,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: t.colors.bgSurfaceRaised,
      borderRadius: t.radius.sheet,
      padding: t.spacing.lg,
      ...t.shadow.raised,
    },
    intro: {
      textAlign: 'center',
      marginBottom: t.spacing.lg,
    },
  }));

  const pick = (type: EventMeetType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.dismiss')}>
        <Pressable style={styles.cardWrap} onPress={() => undefined}>
          <View style={styles.card} accessibilityViewIsModal>
            <DisplaySmText style={styles.intro}>{t('events.meetTypeTitle')}</DisplaySmText>

            <MeetTypeOption
              icon="globe"
              title={t('events.publicMeet')}
              body={t('events.publicMeetBody')}
              onPress={() => pick('public')}
            />
            <MeetTypeOption
              icon="lock"
              title={t('events.privateMeet')}
              body={t('events.privateMeetBody')}
              onPress={() => pick('private')}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
