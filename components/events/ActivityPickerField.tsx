import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import { PillCta } from '@/features/onboarding/components/kit';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { Activity } from '@/types/domain';

/**
 * Activities / Interests in Create meetup — design/…/CrewUp - Friends - Events.dc.html, E4 and E4b.
 * A search-style field that shows the picks as lime chips; tapping it slides up a full-screen selector with
 * search across every group, the picks as removable chips, your activities first, then each group.
 */

const LIME = '#A8E05F';
const INK = '#0E1113';

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6.5} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M15.5 15.5L21 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function Cross({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

type Group = { key: string; label: string; items: Activity[] };

/** "Your activities" first (activities only), then the catalogue's groups in their sort order. */
function buildGroups(items: Activity[], mineIds: string[], yourLabel: string, query: string, resultsLabel: string): Group[] {
  const q = query.trim().toLowerCase();
  if (q) {
    const hits = items.filter((item) => item.name.toLowerCase().includes(q));
    return hits.length ? [{ key: 'results', label: resultsLabel, items: hits }] : [];
  }
  const groups: Group[] = [];
  const mine = items.filter((item) => mineIds.includes(item.id));
  if (mine.length) groups.push({ key: 'mine', label: yourLabel, items: mine });
  const byParent = new Map<string, { order: number; items: Activity[] }>();
  for (const item of items) {
    if (mineIds.includes(item.id)) continue;
    const name = item.parent?.name ?? item.category;
    const entry = byParent.get(name) ?? { order: item.parent?.sort_order ?? 999, items: [] };
    entry.items.push(item);
    byParent.set(name, entry);
  }
  [...byParent.entries()]
    .sort((a, b) => a[1].order - b[1].order || a[0].localeCompare(b[0]))
    .forEach(([name, entry]) => groups.push({ key: name, label: name, items: entry.items }));
  return groups;
}

export function ActivityPickerField({
  kind,
  items,
  mineIds = [],
  selectedIds,
  onChange,
}: {
  kind: 'activity' | 'interest';
  /** Only this kind's rows. */
  items: Activity[];
  mineIds?: string[];
  /** Ids picked across both kinds; only this kind's are shown and toggled here. */
  selectedIds: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useScreenInsets();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const scrim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(height)).current;

  const ownIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const picked = items.filter((item) => selectedIds.includes(item.id));
  const isActivity = kind === 'activity';
  const groups = useMemo(
    () => buildGroups(items, isActivity ? mineIds : [], t('events.yourActivities'), query, t('events.picker.results')),
    [isActivity, items, mineIds, query, t],
  );

  useEffect(() => {
    if (open) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(scrim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 420, easing: Easing.bezier(0.2, 0.9, 0.25, 1), useNativeDriver: true }),
      ]).start();
    } else if (visible) {
      Animated.parallel([
        Animated.timing(scrim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(slide, { toValue: height, duration: 260, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [height, open, scrim, slide, visible]);

  const toggle = (id: string) => {
    hapticSelection();
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };
  const clearMine = () => onChange(selectedIds.filter((id) => !ownIds.has(id)));
  const close = () => setOpen(false);
  const line = theme.mode === 'dark' ? '#262C30' : '#E6E9E1';

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={picked.length ? `${t(isActivity ? 'events.activitiesTitle' : 'events.interestsTitle')}: ${picked.map((item) => item.name).join(', ')}` : t(isActivity ? 'events.picker.addActivities' : 'events.picker.addInterests')}
        onPress={() => {
          setQuery('');
          setOpen(true);
        }}
        style={({ pressed }) => ({
          marginTop: 10,
          minHeight: 58,
          borderRadius: 16,
          backgroundColor: theme.colors.card,
          borderWidth: 1.5,
          borderColor: pressed ? theme.colors.ink : theme.mode === 'dark' ? '#3A4145' : '#D4D8CD',
          paddingVertical: 10,
          paddingLeft: 14,
          paddingRight: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        })}>
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {picked.length ? (
            picked.map((item) => (
              <View key={item.id} style={{ height: 30, borderRadius: 15, paddingHorizontal: 12, backgroundColor: LIME, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: INK }}>{item.name}</Text>
              </View>
            ))
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SearchIcon color={theme.colors.textTertiary} />
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 15, color: theme.colors.textTertiary }}>
                {t(isActivity ? 'events.picker.addActivities' : 'events.picker.addInterests')}
              </Text>
            </View>
          )}
        </View>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M12 5v14M5 12h14" stroke={theme.colors.textPrimary} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </View>
      </Pressable>

      {visible ? (
        <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,17,19,0.42)', opacity: scrim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel={t('common.close')} />
          </Animated.View>
          <Animated.View
            accessibilityViewIsModal
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: insets.top + 12,
              bottom: 0,
              backgroundColor: theme.colors.bgCanvas,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: 'hidden',
              transform: [{ translateY: slide }],
            }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
              <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: theme.colors.track, alignSelf: 'center', marginTop: 8 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 16 }}>
                <View style={{ width: 56 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('common.close')}
                    onPress={close}
                    style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.field, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
                    <Cross color={theme.colors.textPrimary} size={14} />
                  </Pressable>
                </View>
                <Text accessibilityRole="header" style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.jakartaBold, fontSize: 17, color: theme.colors.textPrimary }}>
                  {t(isActivity ? 'events.activitiesTitle' : 'events.interestsTitle')}
                </Text>
                <Pressable accessibilityRole="button" disabled={!picked.length} onPress={clearMine} hitSlop={8} style={{ width: 56, alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: picked.length ? theme.colors.textPrimary : theme.colors.textTertiary }}>{t('events.picker.clear')}</Text>
                </Pressable>
              </View>

              <View
                style={{
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: theme.colors.card,
                  borderWidth: 1.5,
                  borderColor: theme.colors.ink,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingLeft: 16,
                  paddingRight: 8,
                  marginTop: 14,
                  marginHorizontal: 20,
                }}>
                <SearchIcon color={theme.colors.textSecondary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t(isActivity ? 'events.picker.searchActivities' : 'events.picker.searchInterests')}
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  accessibilityLabel={t(isActivity ? 'events.picker.searchActivities' : 'events.picker.searchInterests')}
                  style={{ flex: 1, fontFamily: fontFamily.interRegular, fontSize: 15, color: theme.colors.textPrimary, padding: 0 }}
                />
                {query ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={t('events.picker.clearSearch')} onPress={() => setQuery('')} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#B9BEB2', alignItems: 'center', justifyContent: 'center' }}>
                      <Cross color="#FFFFFF" />
                    </View>
                  </Pressable>
                ) : null}
              </View>

              {picked.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingTop: 12, paddingBottom: 2, paddingHorizontal: 20 }}>
                  {picked.map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={t('events.picker.remove', { name: item.name })}
                      onPress={() => toggle(item.id)}
                      style={{ height: 32, borderRadius: 16, paddingLeft: 12, paddingRight: 10, backgroundColor: LIME, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: INK }}>{item.name}</Text>
                      <Cross color={INK} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 20 }}>
                {groups.map((group) => (
                  <View key={group.key}>
                    <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, letterSpacing: 1, color: theme.colors.textSecondary, paddingTop: 18, paddingBottom: 4 }}>
                      {group.label.toUpperCase()}
                    </Text>
                    {group.items.map((item) => {
                      const on = selectedIds.includes(item.id);
                      return (
                        <Pressable
                          key={`${group.key}-${item.id}`}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          onPress={() => toggle(item.id)}
                          style={({ pressed }) => ({ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: line, opacity: pressed ? 0.7 : 1 })}>
                          <Text style={{ flex: 1, fontFamily: fontFamily.interMedium, fontSize: 15.5, color: theme.colors.textPrimary }}>{item.name}</Text>
                          {on ? (
                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' }}>
                              <Svg width={11} height={9} viewBox="0 0 10 8">
                                <Path d="M1 4l2.8 2.8L9 1.2" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            </View>
                          ) : (
                            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C9CEC1' }} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
                {!groups.length ? (
                  <View style={{ alignItems: 'center', paddingTop: 40, gap: 6 }}>
                    <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: theme.colors.textPrimary, textAlign: 'center' }}>
                      {query.trim() ? t('events.picker.noMatches', { query: query.trim() }) : t('events.picker.empty')}
                    </Text>
                    {query.trim() ? (
                      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' }}>{t('events.picker.tryBroader')}</Text>
                    ) : null}
                  </View>
                ) : null}
              </ScrollView>

              <View style={{ paddingTop: 12, paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 14), borderTopWidth: 1, borderTopColor: theme.colors.hairline }}>
                <PillCta label={picked.length ? t('events.picker.doneCount', { count: picked.length }) : t('events.picker.done')} onPress={close} />
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </Modal>
      ) : null}
    </>
  );
}
