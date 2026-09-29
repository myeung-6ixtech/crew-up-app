export const DISPLAY_NAME_STYLES = ['full', 'initial', 'last'] as const;
export type DisplayNameStyle = (typeof DISPLAY_NAME_STYLES)[number];

/** Live sample for the Display Name choice. Empty parts are left out. */
export function displayNameSample(firstName: string, lastName: string, style: DisplayNameStyle): string {
  const first = firstName.trim();
  const last = lastName.trim();
  const initial = first ? `${first[0]?.toLocaleUpperCase()}.` : '';

  if (style === 'last') return last;
  if (style === 'initial') {
    if (last && initial) return `${last}, ${initial}`;
    return last || initial;
  }
  return [first, last].filter(Boolean).join(' ');
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
): DisplayNameStyle {
  if (!preferredName) return 'full';
  const match = DISPLAY_NAME_STYLES.find((style) => displayNameSample(firstName, lastName, style) === preferredName);
  return match ?? 'full';
}
