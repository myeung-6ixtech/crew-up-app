import i18n from '@/lib/i18n';
import type { Theme } from '@/theme/types';

const NO_UPPERCASE_LABEL_LOCALES = new Set(['zh', 'ja', 'ko', 'th', 'vi']);

/** Label uppercase is disabled for CJK, Thai, and Vietnamese locales. */
export function shouldUppercaseLabels(locale?: string): boolean {
  const code = (locale ?? i18n.language ?? 'en').split('-')[0]?.toLowerCase() ?? 'en';
  return !NO_UPPERCASE_LABEL_LOCALES.has(code);
}

export function labelTypographyStyle(theme: Theme, locale?: string) {
  return {
    ...theme.typography.label,
    textTransform: shouldUppercaseLabels(locale)
      ? ('uppercase' as const)
      : ('none' as const),
  };
}
