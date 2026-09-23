/** App UI locales. Add a row here and a matching `locales/<code>/` bundle when shipping a new language. */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', labelKey: 'settings.languages.en' },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];
