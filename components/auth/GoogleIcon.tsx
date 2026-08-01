import { Text, StyleSheet } from 'react-native';

/** Simple "G" mark for Google button (no asset dependency). */
export function GoogleIcon() {
  return <Text style={styles.g}>G</Text>;
}

const styles = StyleSheet.create({
  g: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
    width: 22,
    textAlign: 'center',
  },
});
