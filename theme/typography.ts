import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
};

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  headline: {
    fontFamily: fontFamily.semiBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 21,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    textTransform: 'uppercase' as const,
  },
  numeric: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 21,
    fontVariant: ['tabular-nums' as const],
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
};
