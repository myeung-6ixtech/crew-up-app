import type { TextStyle } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from '@expo-google-fonts/plus-jakarta-sans';

const tabularNums = ['tabular-nums'] as TextStyle['fontVariant'];

export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
};

export const fontFamily = {
  interRegular: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  jakartaMedium: 'PlusJakartaSans_500Medium',
  jakartaSemiBold: 'PlusJakartaSans_600SemiBold',
} as const;

/** Type scale — see documentation/font-system.md */
export const typography = {
  display: {
    fontFamily: fontFamily.jakartaSemiBold,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  displaySm: {
    fontFamily: fontFamily.jakartaSemiBold,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.1,
  },
  headline: {
    fontFamily: fontFamily.jakartaMedium,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.1,
  },
  bodyStrong: {
    fontFamily: fontFamily.interMedium,
    fontSize: 15,
    lineHeight: 21,
  },
  body: {
    fontFamily: fontFamily.interRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: fontFamily.interRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  label: {
    fontFamily: fontFamily.interMedium,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.2,
    textTransform: 'uppercase' as const,
  },
  numeric: {
    fontFamily: fontFamily.interMedium,
    fontSize: 14,
    lineHeight: 20,
    fontVariant: tabularNums,
  },
  numericLg: {
    fontFamily: fontFamily.jakartaSemiBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.1,
    fontVariant: tabularNums,
  },
  button: {
    fontFamily: fontFamily.interMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  /** @deprecated Use bodySm */
  caption: {
    fontFamily: fontFamily.interRegular,
    fontSize: 12,
    lineHeight: 17,
  },
};
