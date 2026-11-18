import { Redirect, useLocalSearchParams } from 'expo-router';
import { SCREENS } from '@/constants/screens';
import { parseCrewLink } from '@/lib/crewLink';

/**
 * https://crewup.app/c/{crewId} (a Crew QR read by the phone's own camera, or a shared link) opens the app here,
 * then Add friend. Anything that isn't a valid Crew ID still lands on Add friend, which says it's not a CrewUp code.
 */
export default function CrewLinkRoute() {
  const { crewId } = useLocalSearchParams<{ crewId: string }>();
  const id = parseCrewLink(`crewup://c/${crewId ?? ''}`) ?? '';
  return <Redirect href={SCREENS.friends.found(id)} />;
}
