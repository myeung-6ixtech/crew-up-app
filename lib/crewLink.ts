/**
 * Crew QR links. A Crew QR encodes only the Crew ID, as a CrewUp link: https://crewup.app/c/CREW8F2K9M4X (opens the
 * app from the phone's camera via universal / app links). The in-app scanner also accepts crewup://c/… .
 * Anything else is "not a CrewUp code". Dependency-free so it's unit-tested (scripts/crew-link.test.mjs).
 */
export const CREW_LINK_HOST = 'crewup.app';

const CREW_ID = /^CREW[0-9A-HJKMNP-TV-Z]{8}$/;

/** The link a Crew QR encodes. Only the Crew ID goes in it. */
export function crewLink(friendId: string): string {
  const id = friendId.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return `https://${CREW_LINK_HOST}/c/${id}`;
}

/** The Crew ID in a scanned CrewUp link, or null for anything else (other sites, plain text, bad IDs). */
export function parseCrewLink(raw: string | null | undefined): string | null {
  const text = (raw ?? '').trim();
  const match =
    text.match(/^https:\/\/(?:www\.)?crewup\.app\/c\/([A-Za-z0-9-]+)\/?(?:[?#].*)?$/i) ?? text.match(/^crewup:\/\/\/?c\/([A-Za-z0-9-]+)\/?(?:[?#].*)?$/i);
  if (!match) return null;
  const id = match[1].toUpperCase().replace(/-/g, '');
  return CREW_ID.test(id) ? id : null;
}
