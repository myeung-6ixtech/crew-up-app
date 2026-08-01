import type { RosterEntry } from '@/types/domain';

type PresenceRow = {
  id: string;
  user_id: string;
  city: string;
  date_start: string;
  date_end: string;
  user?: {
    profile?: {
      display_name?: string;
      role_type?: string;
      base_airport?: string;
      is_verified?: boolean;
    };
  };
};

function parseDay(value: string): number {
  return new Date(value).setHours(0, 0, 0, 0);
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const startA = parseDay(aStart);
  const endA = parseDay(aEnd || aStart);
  const startB = parseDay(bStart);
  const endB = parseDay(bEnd || bStart);
  return startA <= endB && startB <= endA;
}

export function findCrewCrossingPaths(
  myRosters: RosterEntry[],
  presence: PresenceRow[],
  userId: string,
): PresenceRow[] {
  const myWindows = myRosters
    .filter((r) => r.layover_city && r.layover_start)
    .map((r) => ({
      city: r.layover_city!.toLowerCase(),
      start: r.layover_start!.slice(0, 10),
      end: (r.layover_end ?? r.layover_start)!.slice(0, 10),
    }));

  if (!myWindows.length) return [];

  return presence.filter((p) => {
    if (p.user_id === userId) return false;
    const city = p.city.toLowerCase();
    return myWindows.some(
      (w) => w.city === city && rangesOverlap(w.start, w.end, p.date_start, p.date_end),
    );
  });
}

export function countUniqueCities(rosters: RosterEntry[]): number {
  const cities = new Set(
    rosters.map((r) => r.layover_city?.trim().toUpperCase()).filter(Boolean) as string[],
  );
  return cities.size;
}
