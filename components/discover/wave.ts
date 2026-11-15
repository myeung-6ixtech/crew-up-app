import type { TFunction } from 'i18next';
import type { TripMatchEntry } from '@/types/trip';
import { matchCityName, overlapLabel } from './matches';

/** Layover snapshot stored on a wave message and on the friend request that becomes one. */
export type WaveMeta = {
  overlap_key: string;
  city?: string;
  match_type?: string;
  overlap_start?: string;
  overlap_end?: string;
  flight_number?: string;
};

export function waveMetaFromRoute(params: {
  waveCity?: string;
  waveMatchType?: string;
  waveStart?: string;
  waveEnd?: string;
  waveFlight?: string;
}): WaveMeta | undefined {
  const city = params.waveCity ?? '';
  const match_type = params.waveMatchType ?? '';
  const overlap_start = params.waveStart ?? '';
  const overlap_end = params.waveEnd ?? '';
  if (!city && !match_type && !overlap_start) return undefined;
  return {
    overlap_key: [match_type, city.trim().toLowerCase(), overlap_start, overlap_end].join('|'),
    city,
    match_type,
    overlap_start,
    overlap_end,
    flight_number: params.waveFlight ?? '',
  };
}

export function waveMetaFromMatch(match: TripMatchEntry): WaveMeta {
  const city = matchCityName(match);
  return {
    overlap_key: [match.match_type, city.trim().toLowerCase(), match.overlap_start ?? '', match.overlap_end ?? ''].join('|'),
    city,
    match_type: match.match_type,
    overlap_start: match.overlap_start ?? '',
    overlap_end: match.overlap_end ?? '',
    flight_number: match.flight_number ?? '',
  };
}

/** `${userId}|${overlap_key}` so one layover can be waved once. */
export function waveNudgeKey(userId: string, overlapKey: string): string {
  return `${userId}|${overlapKey}`;
}

function waveDuration(meta?: { overlap_start?: string; overlap_end?: string } | null): string | null {
  if (!meta?.overlap_start || !meta.overlap_end) return null;
  const ms = Date.parse(meta.overlap_end) - Date.parse(meta.overlap_start);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return overlapLabel(ms / 3_600_000);
}

/** Centred chat card, or the inbox line. Inbox does not repeat the friend's name. */
export function waveCaption(
  meta: Pick<WaveMeta, 'city' | 'overlap_start' | 'overlap_end'> | null | undefined,
  options: { mine: boolean; name?: string; inbox?: boolean },
  t: TFunction,
): string {
  const city = meta?.city?.trim();
  const duration = waveDuration(meta);
  const lead = options.inbox
    ? options.mine
      ? t('messages.waveYou')
      : t('messages.waveInbox')
    : options.mine
      ? t('messages.waveYou')
      : t('messages.waveThem', { name: options.name || t('home.crewMember') });
  const detail = [city ? t('messages.wavePlace', { city }) : null, duration ? t('discover.overlap', { duration }) : null].filter(Boolean);
  return detail.length ? `${lead} · ${detail.join(' · ')}` : lead;
}
