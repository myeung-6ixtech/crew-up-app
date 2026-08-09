import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import { labelTypographyStyle } from '@/theme/labelTypography';

type Variant =
  | 'display'
  | 'displaySm'
  | 'headline'
  | 'body'
  | 'bodyStrong'
  | 'bodySm'
  | 'label'
  | 'numeric'
  | 'numericLg'
  | 'button'
  | 'caption';

type VariantProps = RNTextProps & {
  variant?: Variant;
  muted?: boolean;
};

function ThemedText({ variant = 'body', muted, style, ...props }: VariantProps) {
  const theme = useTheme();
  const resolvedVariant = variant === 'caption' ? 'bodySm' : variant;
  const variantStyle = theme.typography[resolvedVariant];
  const color = muted ? theme.colors.textSecondary : theme.colors.textPrimary;

  return <RNText style={[variantStyle, { color }, style]} {...props} />;
}

export function DisplayText(props: RNTextProps) {
  return <ThemedText variant="display" {...props} />;
}

export function DisplaySmText(props: RNTextProps) {
  return <ThemedText variant="displaySm" {...props} />;
}

export function HeadlineText(props: RNTextProps) {
  return <ThemedText variant="headline" {...props} />;
}

export function BodyText(props: RNTextProps & { strong?: boolean; muted?: boolean }) {
  const { strong, muted, ...rest } = props;
  return <ThemedText variant={strong ? 'bodyStrong' : 'body'} muted={muted} {...rest} />;
}

export function BodySmText(props: RNTextProps & { muted?: boolean }) {
  const { muted, ...rest } = props;
  return <ThemedText variant="bodySm" muted={muted} {...rest} />;
}

export function LabelText(props: RNTextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[labelTypographyStyle(theme), { color: theme.colors.textTertiary }, props.style]}
      {...props}
    />
  );
}

export function NumericText(props: RNTextProps & { muted?: boolean; large?: boolean }) {
  const { muted, large, ...rest } = props;
  return <ThemedText variant={large ? 'numericLg' : 'numeric'} muted={muted} {...rest} />;
}

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <HeadlineText style={[{ marginBottom: 8 }, style]}>{children}</HeadlineText>;
}

export function Subtitle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <BodyText muted style={[{ marginBottom: 16 }, style]}>{children}</BodyText>;
}

export { ThemedText };
