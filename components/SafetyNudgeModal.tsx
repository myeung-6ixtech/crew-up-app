import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, HeadlineText, BodyText } from '@/components/ui';
import { useThemedStyles } from '@/theme';

export function SafetyNudgeModal({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles((t) => ({
    backdrop: {
      flex: 1,
      backgroundColor: t.colors.scrim,
      justifyContent: 'center',
      padding: t.spacing.xl,
    },
    card: {
      backgroundColor: t.colors.bgSurfaceRaised,
      borderRadius: t.radius.card,
      padding: t.spacing.xl,
      ...t.shadow.raised,
    },
    title: { marginBottom: t.spacing.sm },
    body: { marginBottom: t.spacing.lg },
  }));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <HeadlineText style={styles.title}>{t('safety.nudgeTitle')}</HeadlineText>
          <BodyText muted style={styles.body}>{t('safety.nudgeBody')}</BodyText>
          <Button label="Got it" onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}
