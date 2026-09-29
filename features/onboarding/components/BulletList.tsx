import { BodyText } from '@/components/ui';
import { useTheme } from '@/theme';

export function BulletList({ items }: { items: string[] }) {
  const theme = useTheme();
  return (
    <>
      {items.map((item) => (
        <BodyText key={item} style={{ marginBottom: theme.spacing.sm }}>
          {`•  ${item}`}
        </BodyText>
      ))}
    </>
  );
}
