import { Redirect } from 'expo-router';
import { SCREENS } from '@/constants/screens';

export default function VerificationStatusScreen() {
  return <Redirect href={SCREENS.profile.edit} />;
}
