import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type NavTab = 'index' | 'events' | 'messages' | 'friends' | 'profile';

/** Outline when idle, filled when active — the only active marker the nav pill uses. */
export function NavIcon({ tab, active, color, cutout }: { tab: Exclude<NavTab, 'profile'>; active: boolean; color: string; cutout: string }) {
  const size = 26;
  switch (tab) {
    case 'index':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5.5v-6h-5v6H4a1 1 0 01-1-1z"
            fill={active ? color : 'none'}
            stroke={active ? undefined : color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'events':
      return active ? (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={3} y={4.5} width={18} height={16.5} rx={3} fill={color} />
          <Path d="M3 9.5h18" stroke={cutout} strokeWidth={2} />
          <Path d="M8 2.5v4M16 2.5v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={3} y={4.5} width={18} height={16.5} rx={3} stroke={color} strokeWidth={2} fill="none" />
          <Path d="M3 9.5h18M8 2.5v4M16 2.5v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'messages':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M6.5 3h11A2.5 2.5 0 0120 5.5v8a2.5 2.5 0 01-2.5 2.5H11l-5 4.5V16A2.5 2.5 0 014 13.5v-8A2.5 2.5 0 016.5 3z"
            fill={active ? color : 'none'}
            stroke={active ? undefined : color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'friends':
      return active ? (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={9} cy={8} r={4} fill={color} />
          <Path d="M1.5 20.5c.7-3.8 3.8-6.5 7.5-6.5s6.8 2.7 7.5 6.5z" fill={color} />
          <Circle cx={17} cy={7} r={3} fill={color} />
          <Path d="M17.5 12.5c2.7.3 4.5 2.6 5 5.5h-4" fill={color} />
        </Svg>
      ) : (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={9} cy={8} r={4} stroke={color} strokeWidth={2} fill="none" />
          <Path d="M1.5 20.5c.7-3.8 3.8-6.5 7.5-6.5s6.8 2.7 7.5 6.5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M15.5 4.3A3 3 0 1117 10M18 13c2.4.6 3.9 2.6 4.3 5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      );
  }
}
