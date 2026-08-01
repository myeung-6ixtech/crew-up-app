import { Redirect } from 'expo-router';
import { SCREENS } from '@/constants/screens';

export default function RegisterScreen() {
  return <Redirect href={SCREENS.auth.email('signup')} />;
}
