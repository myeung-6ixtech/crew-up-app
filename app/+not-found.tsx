import { Link } from 'expo-router';
import { Screen, Title, BodyText } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Title>Page not found</Title>
      <BodyText muted>This screen does not exist.</BodyText>
      <Link href="/">
        <BodyText>Go to home</BodyText>
      </Link>
    </Screen>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Screen>
      <Title>Something went wrong</Title>
      <BodyText muted>{error.message}</BodyText>
    </Screen>
  );
}
