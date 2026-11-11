import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { hapticSelection, hapticWarning } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

/** Matches events_tags_shape in crew-up-nhost (8 tags, a–z 0–9 _, up to 24 characters). */
export const MAX_EVENT_TAGS = 8;
const MAX_TAG_LENGTH = 24;

/** One-tap suggestions; they drop into the same list as typed tags. */
export const QUICK_EVENT_TAGS = ['alcohol_free', 'halal_friendly', 'women_only', 'first_timers', 'budget', 'pet_friendly', 'jet_lag_friendly'] as const;

/** "#Sunday Brunch!" → sunday_brunch. Stored with underscores, like the original quick tags. */
export function normalizeEventTag(raw: string) {
  return raw
    .toLowerCase()
    .replace(/^#+/, '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, MAX_TAG_LENGTH);
}

/** Shown as typed: sunday_brunch → sunday-brunch. */
export function eventTagLabel(tag: string) {
  return tag.replace(/_/g, '-');
}

/**
 * Tags in Create meetup — design/…/CrewUp - Friends - Events.dc.html, E5. Type and press return (or Add);
 * tap a tag to remove it. Quick tags are suggestions that toggle in and out of the same list.
 */
export function EventTagsField({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [draft, setDraft] = useState('');
  const normalized = normalizeEventTag(draft);
  const full = tags.length >= MAX_EVENT_TAGS;
  const canAdd = normalized.length > 0 && !full;

  const commit = (raw: string) => {
    const tag = normalizeEventTag(raw);
    setDraft('');
    if (!tag) return;
    if (full) return hapticWarning();
    hapticSelection();
    if (!tags.includes(tag)) onChange([...tags, tag]);
  };
  const add = () => commit(draft);

  const remove = (tag: string) => {
    hapticSelection();
    onChange(tags.filter((item) => item !== tag));
  };

  const toggleQuick = (tag: string) => {
    if (tags.includes(tag)) return remove(tag);
    if (full) return hapticWarning();
    hapticSelection();
    onChange([...tags, tag]);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }}>
        <MonoLabel style={{ fontSize: 10.5 }}>{t('events.tags')}</MonoLabel>
        <Text accessibilityLabel={t('events.tagCountA11y', { count: tags.length, max: MAX_EVENT_TAGS })} style={{ fontFamily: fontFamily.monoMedium, fontSize: 10.5, color: theme.colors.textTertiary }}>
          {`${tags.length}/${MAX_EVENT_TAGS}`}
        </Text>
      </View>
      <View
        style={{
          minHeight: 52,
          borderRadius: 14,
          backgroundColor: theme.colors.card,
          borderWidth: 1.5,
          borderColor: theme.mode === 'dark' ? '#3A4145' : '#D4D8CD',
          paddingVertical: 8,
          paddingLeft: 10,
          paddingRight: 8,
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
        }}>
        {tags.map((tag) => (
          <Pressable
            key={tag}
            accessibilityRole="button"
            accessibilityLabel={t('events.removeTag', { tag: eventTagLabel(tag) })}
            onPress={() => remove(tag)}
            style={({ pressed }) => ({
              height: 30,
              borderRadius: 15,
              paddingLeft: 12,
              paddingRight: 10,
              backgroundColor: '#0E1113',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              opacity: pressed ? 0.75 : 1,
            })}>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: '#F7F8F4' }}>{`#${eventTagLabel(tag)}`}</Text>
            <Svg width={9} height={9} viewBox="0 0 24 24">
              <Path d="M6 6l12 12M18 6L6 18" stroke="#A7B1B5" strokeWidth={2.8} strokeLinecap="round" />
            </Svg>
          </Pressable>
        ))}
        {!full ? (
          <TextInput
            value={draft}
            onChangeText={(value) => {
              // A comma adds the tag, like return.
              if (value.endsWith(',')) {
                commit(value.slice(0, -1));
                return;
              }
              setDraft(value);
            }}
            onSubmitEditing={add}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !draft && tags.length) remove(tags[tags.length - 1]);
            }}
            blurOnSubmit={false}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={40}
            accessibilityLabel={t('events.tags')}
            placeholder={tags.length ? t('events.tagAnother') : t('events.tagPlaceholder')}
            placeholderTextColor={theme.colors.textTertiary}
            style={{ flex: 1, minWidth: 110, height: 30, padding: 0, fontFamily: fontFamily.interRegular, fontSize: 14.5, color: theme.colors.textPrimary }}
          />
        ) : null}
        {canAdd ? (
          <Pressable
            accessibilityRole="button"
            onPress={add}
            style={({ pressed }) => ({ height: 32, borderRadius: 16, paddingHorizontal: 14, backgroundColor: '#A8E05F', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13, color: '#0E1113' }}>{t('events.addTag')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary, marginTop: 6 }}>
        {full ? t('events.tagsFull', { max: MAX_EVENT_TAGS }) : t('events.tagsHint', { max: MAX_EVENT_TAGS })}
      </Text>

      <MonoLabel style={{ fontSize: 10.5, marginTop: 14, marginBottom: 8 }}>{t('events.quickTags')}</MonoLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {QUICK_EVENT_TAGS.map((tag) => {
          const on = tags.includes(tag);
          return (
            <Pressable
              key={tag}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled: full && !on }}
              onPress={() => toggleQuick(tag)}
              style={({ pressed }) => ({
                height: 34,
                borderRadius: 17,
                paddingHorizontal: 13,
                backgroundColor: on ? '#A8E05F' : theme.colors.card,
                borderWidth: 1.5,
                borderColor: on ? '#A8E05F' : theme.mode === 'dark' ? '#3A4145' : '#D4D8CD',
                justifyContent: 'center',
                opacity: full && !on ? 0.45 : pressed ? 0.75 : 1,
              })}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: on ? '#0E1113' : theme.colors.textPrimary }}>
                {`${on ? '✓' : '+'} ${t(`events.tag.${tag}`, { defaultValue: eventTagLabel(tag) })}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
