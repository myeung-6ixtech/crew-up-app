import { AppIcon, Button } from '@/components/ui';
import { useTheme } from '@/theme';
import type { AppIconName } from '@/components/icons';

export function ProfileMenuButton({
  label,
  icon,
  onPress,
  variant = 'secondary',
}: {
  label: string;
  icon: AppIconName;
  onPress: () => void;
  variant?: 'secondary' | 'destructive';
}) {
  const theme = useTheme();
  return (
    <Button
      label={label}
      onPress={onPress}
      variant={variant === 'destructive' ? 'destructive' : 'secondary'}
      icon={
        <AppIcon
          name={icon}
          size={18}
          color={variant === 'destructive' ? theme.colors.textInverse : theme.colors.accent}
        />
      }
    />
  );
}
