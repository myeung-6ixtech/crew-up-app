import type { RosterEntry } from '@/types/domain';
import type { CrewStatus } from '@/components/ui/StatusDot';
import type { Profile } from '@/types/domain';

export type DutyType = 'flight' | 'layover' | 'off';

const DUTY_NOTE_PREFIX = 'duty:';

export function encodeDutyNote(duty: DutyType): string {
  return `${DUTY_NOTE_PREFIX}${duty}`;
}

export function parseDutyType(notes?: string | null): DutyType {
  if (!notes) return 'layover';
  const match = notes.match(/duty:(flight|layover|off)/);
  return (match?.[1] as DutyType) ?? 'layover';
}

export function rosterToDisplayStatus(entry: RosterEntry): CrewStatus {
  const duty = parseDutyType(entry.notes ?? null);
  if (duty === 'off') return 'available';
  if (duty === 'flight') return 'onDuty';
  return 'layover';
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isTodayInRange(start?: string | null, end?: string | null): boolean {
  const startDate = parseDate(start);
  const endDate = parseDate(end) ?? startDate;
  if (!startDate || !endDate) return false;
  const now = new Date();
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const e = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return day >= s && day <= e;
}

export function resolveCurrentStatus(
  rosters: RosterEntry[],
  profile: Profile | null,
): CrewStatus {
  if (profile?.default_visibility === 'off') return 'available';

  const active = rosters.find((r) => isTodayInRange(r.layover_start, r.layover_end));
  if (!active) return 'available';

  return rosterToDisplayStatus(active);
}

export function formatRoleLabel(role?: string | null): string {
  if (!role) return 'Crew';
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatProfileCaption(
  profile: Profile | null,
  airlineName?: string | null,
): string {
  const parts = [
    formatRoleLabel(profile?.role_type),
    airlineName,
    profile?.base_airport ? `Based ${profile.base_airport}` : null,
  ].filter(Boolean);
  return parts.join(' · ') || 'Complete your profile';
}

export function rosterRouteLabel(entry: RosterEntry): string {
  if (entry.departure_airport && entry.arrival_airport) {
    return `${entry.departure_airport} → ${entry.arrival_airport}`;
  }
  return entry.layover_city ?? 'Trip';
}
