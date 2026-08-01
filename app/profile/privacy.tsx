import { Redirect } from 'expo-router';
import { SCREENS } from '@/constants/screens';

export default function PrivacyScreen() {
  return <Redirect href={SCREENS.profile.edit} />;
}
