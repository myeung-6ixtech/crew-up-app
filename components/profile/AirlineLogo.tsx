import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SelectionSquircle, usePickerFieldStyles } from '@/components/profile/pickerFieldShared';

type AirlineLogoProps = {
  code: string;
  muted?: boolean;
};

function airlineLogoUrl(code: string): string {
  return `https://images.kiwi.com/airlines/64/${encodeURIComponent(code.toUpperCase())}.png`;
}

export function AirlineLogo({ code, muted = false }: AirlineLogoProps) {
  const styles = usePickerFieldStyles();
  const [failed, setFailed] = useState(false);
  const normalized = code.trim().toUpperCase();

  if (!normalized || failed) {
    return (
      <SelectionSquircle muted={muted || !normalized}>
        <Text style={normalized ? styles.squircleCode : styles.squirclePlaceholder}>
          {normalized.slice(0, 3) || '—'}
        </Text>
      </SelectionSquircle>
    );
  }

  return (
    <SelectionSquircle muted={muted}>
      <Image
        source={{ uri: airlineLogoUrl(normalized) }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </SelectionSquircle>
  );
}

export function AirlineLogoInline({ code }: { code: string }) {
  const styles = usePickerFieldStyles();
  const [failed, setFailed] = useState(false);
  const normalized = code.trim().toUpperCase();

  if (!normalized || failed) {
    return (
      <View style={[styles.squircle, { width: 36, height: 36, borderRadius: 11 }]}>
        <Text style={[styles.squircleCode, { fontSize: 11 }]}>{normalized.slice(0, 3)}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.squircle, { width: 36, height: 36, borderRadius: 11, overflow: 'hidden' }]}>
      <Image
        source={{ uri: airlineLogoUrl(normalized) }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </View>
  );
}
