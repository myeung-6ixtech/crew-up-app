import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'display' | 'headline' | 'body' | 'bodyStrong' | 'label' | 'numeric' | 'caption';

type VariantProps = RNTextProps & {
  variant?: Variant;
  muted?: boolean;
};

function ThemedText({ variant = 'body', muted, style, ...props }: VariantProps) {
  const theme = useTheme();
  const variantStyle =
    variant === 'caption' ? theme.typography.caption : theme.typography[variant];
  const color = muted ? theme.colors.textSecondary : theme.colors.textPrimary;

  return <RNText style={[variantStyle, { color }, style]} {...props} />;
}

export function DisplayText(props: RNTextProps) {
  return <ThemedText variant="display" {...props} />;
}

export function HeadlineText(props: RNTextProps) {
  return <ThemedText variant="headline" {...props} />;
}

export function BodyText(props: RNTextProps & { strong?: boolean; muted?: boolean }) {
  const { strong, muted, ...rest } = props;
  return <ThemedText variant={strong ? 'bodyStrong' : 'body'} muted={muted} {...rest} />;
}

export function LabelText(props: RNTextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[theme.typography.label, { color: theme.colors.textTertiary }, props.style]}
      {...props}
    />
  );
}

export function NumericText(props: RNTextProps & { muted?: boolean }) {
  const { muted, ...rest } = props;
  return <ThemedText variant="numeric" muted={muted} {...rest} />;
}

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <HeadlineText style={[{ marginBottom: 8 }, style]}>{children}</HeadlineText>;
}

export function Subtitle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <BodyText muted style={[{ marginBottom: 16 }, style]}>{children}</BodyText>;
}

export { ThemedText };
