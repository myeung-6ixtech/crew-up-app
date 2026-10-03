import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useApolloClient } from '@/lib/apolloHooks';
import { fetchAirlines } from '@/services/profileService';
import { fontFamily, useTheme } from '@/theme';

export type AirlineInfo = { id: string; code: string; name: string };

let cache: Map<string, AirlineInfo> | null = null;
let pending: Promise<Map<string, AirlineInfo>> | null = null;

/** Airline id → code and name. Loaded once per app session. */
export function useAirlines() {
  const client = useApolloClient();
  const [airlines, setAirlines] = useState<Map<string, AirlineInfo>>(cache ?? new Map());

  useEffect(() => {
    if (cache) return;
    pending ??= fetchAirlines(client)
      .then((rows: AirlineInfo[]) => new Map(rows.map((row) => [row.id, row])))
      .catch(() => new Map<string, AirlineInfo>());
    let alive = true;
    void pending.then((map) => {
      cache = map.size ? map : null;
      if (!map.size) pending = null;
      if (alive) setAirlines(map);
    });
    return () => {
      alive = false;
    };
  }, [client]);

  return airlines;
}

/** Square airline logo with rounded corners; falls back to the code. */
export function AirlineMark({ code, size = 22 }: { code: string; size?: number }) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const normalized = code.trim().toUpperCase();
  const radius = Math.round(size * 0.27);
  if (!normalized || failed) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: Math.max(8, size * 0.36), color: theme.colors.textPrimary }}>{normalized.slice(0, 2)}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: `https://images.kiwi.com/airlines/64/${encodeURIComponent(normalized)}.png` }}
      accessibilityIgnoresInvertColors
      onError={() => setFailed(true)}
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.colors.card }}
    />
  );
}

/** Small mono code chip for crew on another airline. */
export function AirlineCodeChip({ code }: { code: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontFamily: fontFamily.monoMedium,
        fontSize: 9.5,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.field,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 5,
        overflow: 'hidden',
      }}>
      {code.toUpperCase()}
    </Text>
  );
}

/** "[logo] Cathay Pacific · Cabin crew · DXB": the logo for your own airline, a code chip for others. */
export function AirlineLine({
  airline,
  mine,
  rest,
  size = 18,
  emphasize = false,
}: {
  airline?: AirlineInfo | null;
  mine: boolean;
  rest: string;
  size?: number;
  /** Bold airline name, as on your own profile. */
  emphasize?: boolean;
}) {
  const theme = useTheme();
  if (!airline) {
    return rest ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>{rest}</Text> : null;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size >= 22 ? 8 : 6, flexShrink: 1 }}>
      {mine ? <AirlineMark code={airline.code} size={size} /> : <AirlineCodeChip code={airline.code} />}
      <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }}>
        {emphasize ? <Text style={{ fontFamily: fontFamily.interMedium, color: theme.colors.textPrimary }}>{airline.name}</Text> : airline.name}
        {rest ? ` · ${rest}` : ''}
      </Text>
    </View>
  );
}
