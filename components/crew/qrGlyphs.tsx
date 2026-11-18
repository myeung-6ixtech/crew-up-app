import Svg, { Path, Rect } from 'react-native-svg';

/** QR glyph for the "QR" pill. */
export function QrGlyph({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Rect x={1} y={1} width={4.5} height={4.5} rx={1} stroke={color} strokeWidth={1.5} fill="none" />
      <Rect x={8.5} y={1} width={4.5} height={4.5} rx={1} stroke={color} strokeWidth={1.5} fill="none" />
      <Rect x={1} y={8.5} width={4.5} height={4.5} rx={1} stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M8.5 8.5h2v2h-2zM11 11h2v2h-2zM11 8.5h2M8.5 12.5h1" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** Corner brackets around a dot: "Scan a Crew QR code". */
export function ScanFrameGlyph({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path
        d="M1.5 5.5v-2a2 2 0 012-2h2M12.5 1.5h2a2 2 0 012 2v2M16.5 12.5v2a2 2 0 01-2 2h-2M5.5 16.5h-2a2 2 0 01-2-2v-2M5 9h8"
        stroke={color}
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CopyGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14">
      <Rect x={4.5} y={4.5} width={8} height={8} rx={2} stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M9.5 2.5v-.5a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1h.5" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckGlyph({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={(size * 8) / 10} viewBox="0 0 10 8">
      <Path d="M1 4l2.8 2.8L9 1.2" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TorchGlyph({ color, on, size = 18 }: { color: string; on: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path
        d="M6 1.5h6l-1 4H7l-1-4zM7 5.5h4v10a1 1 0 01-1 1H8a1 1 0 01-1-1v-10z"
        stroke={color}
        strokeWidth={1.6}
        fill={on ? color : 'none'}
        strokeLinejoin="round"
      />
      <Path d="M9 9v2" stroke={on ? '#0E1113' : color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseGlyph({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M1 1l8 8M9 1L1 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
