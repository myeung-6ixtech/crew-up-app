import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon, type AppIconName } from '@/components/icons';
import { useThemedStyles, useTheme } from '@/theme';
import { BodyText, DisplaySmText } from './Text';

export type ChoiceModalOption<T extends string> = {
  value: T;
  icon: AppIconName;
  title: string;
  body: string;
};

type ChoiceModalProps<T extends string> = {
  visible: boolean;
  title: string;
  options: ChoiceModalOption<T>[];
  onClose: () => void;
  onSelect: (value: T) => void;
};

function ChoiceOption({
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
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.option, { opacity: pressed ? 0.82 : 1 }]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <AppIcon name={icon} size={20} color={theme.colors.accentText} />
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

/** Centered modal with a title and tappable option cards. Tapping outside dismisses it. */
export function ChoiceModal<T extends string>({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: ChoiceModalProps<T>) {
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

  const pick = (value: T) => {
    onSelect(value);
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
            <DisplaySmText style={styles.intro}>{title}</DisplaySmText>
            {options.map((option) => (
              <ChoiceOption
                key={option.value}
                icon={option.icon}
                title={option.title}
                body={option.body}
                onPress={() => pick(option.value)}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
