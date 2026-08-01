import { Redirect } from 'expo-router';
import { SCREENS } from '@/constants/screens';

export default function LoginScreen() {
  return <Redirect href={SCREENS.auth.email('signin')} />;
}
