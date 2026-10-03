export const DISPLAY_NAME_STYLES = ['full', 'initial', 'last', 'native', 'fullNative'] as const;
export type DisplayNameStyle = (typeof DISPLAY_NAME_STYLES)[number];

/** `preferred_name` is stored with a 50-character limit. */
const MAX_PREFERRED_NAME = 50;

/** Live sample for the Display Name choice. Empty parts are left out. */
export function displayNameSample(
  firstName: string,
  lastName: string,
  style: DisplayNameStyle,
  otherName?: string | null,
): string {
  const first = firstName.trim();
  const last = lastName.trim();
  const other = otherName?.trim() ?? '';
  const initial = first ? `${first[0]?.toLocaleUpperCase()}.` : '';
  const full = [first, last].filter(Boolean).join(' ');

  if (style === 'last') return last;
  if (style === 'initial') {
    if (last && initial) return `${last}, ${initial}`;
    return last || initial;
  }
  if (style === 'native') return other;
  if (style === 'fullNative') {
    if (full && other) return `${full} (${other})`;
    return other || full;
  }
  return full;
}

/**
 * The three legal-name choices, plus the other-name choices when that field
 * has text and the result is a new name we can store.
 */
export function displayNameOptions(firstName: string, lastName: string, otherName?: string | null): DisplayNameStyle[] {
  const base: DisplayNameStyle[] = ['full', 'initial', 'last'];
  const other = otherName?.trim() ?? '';
  if (!other) return base;

  const seen = new Set(base.map((style) => displayNameSample(firstName, lastName, style, other)).filter(Boolean));
  const extras: DisplayNameStyle[] = ['native', 'fullNative'];
  return [
    ...base,
    ...extras.filter((style) => {
      const sample = displayNameSample(firstName, lastName, style, other);
      if (!sample || sample.length > MAX_PREFERRED_NAME || seen.has(sample)) return false;
      seen.add(sample);
      return true;
    }),
  ];
}

/** Last word is the family name, so a given name like "Tai Man" survives a reload. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const space = trimmed.lastIndexOf(' ');
  if (space === -1) return { firstName: trimmed, lastName: '' };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space + 1) };
}

/** Match a saved display name back to a style, or full if it was typed freely. */
export function displayStyleFromSaved(
  firstName: string,
  lastName: string,
  preferredName: string | null | undefined,
  otherName?: string | null,
): DisplayNameStyle {
  if (!preferredName) return 'full';
  const match = DISPLAY_NAME_STYLES.find(
    (style) => displayNameSample(firstName, lastName, style, otherName) === preferredName,
  );
  return match ?? 'full';
}
