import { requireOptionalNativeModule } from 'expo';

/**
 * Device location for the venue sheet, loaded only when this build has the native module. Expo Router loads every
 * screen at start-up, so a direct `expo-location` import would crash a build (or an over-the-air update) without it.
 * Without the module, location simply isn't offered.
 */
type LocationModule = typeof import('expo-location');
const Location: LocationModule | null = requireOptionalNativeModule('ExpoLocation')
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('expo-location') as LocationModule)
  : null;

export type LatLng = { lat: number; lng: number };
export type LocationAccess = 'granted' | 'ask' | 'denied' | 'unavailable';

/** Whether we may read the location now, could ask, or can't (denied, or no module in this build). Never prompts. */
export async function locationAccess(): Promise<LocationAccess> {
  if (!Location) return 'unavailable';
  const permission = await Location.getForegroundPermissionsAsync();
  return permission.granted ? 'granted' : permission.canAskAgain ? 'ask' : 'denied';
}

/** Asks if needed (the system prompt), then reads the position. Null when refused or unavailable. */
export async function currentLocation(options: { ask: boolean }): Promise<LatLng | null> {
  if (!Location) return null;
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted && options.ask && permission.canAskAgain) permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;
  const position =
    (options.ask ? null : await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
  return position ? { lat: position.coords.latitude, lng: position.coords.longitude } : null;
}
