import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import { RowChevron } from '@/components/crew/kit';
import { BottomSheet } from '@/components/ui';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { hapticImpact, hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';

const RED = '#9B2C1F';

export type MeetState = 'open' | 'rsvps_closed' | 'cancelled';

export function meetState(event: { rsvp_closed_at?: string | null; cancelled_at?: string | null }): MeetState {
  if (event.cancelled_at) return 'cancelled';
  if (event.rsvp_closed_at) return 'rsvps_closed';
  return 'open';
}

/** Mono chip on the dark title card: OPEN, RSVPS CLOSED, CANCELLED, YOU'RE HOSTING. */
export function StateChip({ label, tone }: { label: string; tone: 'lime' | 'open' | 'closed' | 'cancelled' }) {
  const colors = {
    lime: { bg: '#A8E05F', fg: '#0E1113' },
    open: { bg: '#2C3134', fg: '#EDF1F2' },
    closed: { bg: '#E8C25A', fg: '#0E1113' },
    cancelled: { bg: RED, fg: '#FFFFFF' },
  }[tone];
  return (
    <MonoLabel
      style={{
        fontSize: 10,
        color: colors.fg,
        backgroundColor: colors.bg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
      {label}
    </MonoLabel>
  );
}

export function stateChipTone(state: MeetState) {
  return state === 'cancelled' ? 'cancelled' : state === 'rsvps_closed' ? 'closed' : 'open';
}

export function PencilGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Path d="M2 14l.8-3.2L11 2.6a1.4 1.4 0 012 0l.4.4a1.4 1.4 0 010 2L5.2 13.2z" stroke={color} strokeWidth={1.7} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function PeopleGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx={9} cy={8} r={3.5} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M2.5 20c.7-3.4 3.4-5.5 6.5-5.5s5.8 2.1 6.5 5.5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M16 4.6a3 3 0 010 6.3M18 14.5c1.9.6 3.2 2.4 3.6 4.8" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function CloseGlyph() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Circle cx={8} cy={8} r={6.3} stroke={RED} strokeWidth={1.7} fill="none" />
      <Path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke={RED} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function CheckGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Path d="M3 8.5l3 3 7-7" stroke={color} strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DotsGlyph({ color }: { color: string }) {
  return (
    <Svg width={18} height={4} viewBox="0 0 18 4">
      <Circle cx={2} cy={2} r={2} fill={color} />
      <Circle cx={9} cy={2} r={2} fill={color} />
      <Circle cx={16} cy={2} r={2} fill={color} />
    </Svg>
  );
}

function ControlRow({
  icon,
  iconBg,
  title,
  titleColor,
  subtitle,
  body,
  trailing,
  onPress,
  divider,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  body?: ReactNode;
  trailing?: ReactNode;
  onPress: () => void;
  divider: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={() => {
        hapticImpact();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 13,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: theme.colors.hairline,
        opacity: pressed ? 0.7 : 1,
      })}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0, gap: body ? 6 : 1 }}>
        {body ?? (
          <>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: titleColor ?? theme.colors.textPrimary }}>{title}</Text>
            {subtitle ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>{subtitle}</Text> : null}
          </>
        )}
      </View>
      {trailing ?? <RowChevron color={theme.colors.textTertiary} />}
    </Pressable>
  );
}

export function CapacityBar({ going, capacity }: { going: number; capacity: number | null | undefined }) {
  const theme = useTheme();
  const pct = capacity ? Math.min(100, (going / capacity) * 100) : 0;
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.track, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: theme.colors.fill }} />
    </View>
  );
}

/**
 * Host controls: edit, attendees, close. Close is set apart in red.
 * Closed: edit and Reopen stay. Cancelled: only the attendee list remains.
 */
export function HostControls({
  state,
  going,
  capacity,
  attendeesPreview,
  onEdit,
  onAttendees,
  onClose,
  onReopen,
}: {
  state: MeetState;
  going: number;
  capacity: number | null | undefined;
  attendeesPreview?: ReactNode;
  onEdit: () => void;
  onAttendees: () => void;
  onClose: () => void;
  onReopen: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const cancelled = state === 'cancelled';
  const closed = state === 'rsvps_closed';
  const spots = capacity ? Math.max(0, capacity - going) : null;

  const rows: ReactNode[] = [];
  if (!cancelled) {
    rows.push(
      <ControlRow
        key="edit"
        icon={<PencilGlyph color={theme.colors.textPrimary} />}
        iconBg={theme.colors.field}
        title={t('eventHost.edit')}
        subtitle={closed ? t('eventHost.editClosedHint') : t('eventHost.editHint')}
        onPress={onEdit}
        divider
      />,
    );
  }
  rows.push(
    <ControlRow
      key="attendees"
      icon={<PeopleGlyph color={theme.colors.textPrimary} />}
      iconBg={theme.colors.field}
      title={t('events.attendees')}
      body={
        state === 'open' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{t('events.attendees')}</Text>
              <Text style={{ fontFamily: fontFamily.monoMedium, fontSize: 11, color: theme.colors.accentText }}>
                {capacity ? `${going} / ${capacity}` : String(going)}
              </Text>
            </View>
            <CapacityBar going={going} capacity={capacity} />
          </>
        ) : (
          <>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 15, color: theme.colors.textPrimary }}>{t('events.attendees')}</Text>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>
              {cancelled ? t('eventHost.wereGoing', { count: going }) : t('eventHost.goingCount', { count: going })}
            </Text>
          </>
        )
      }
      trailing={state === 'open' ? undefined : attendeesPreview}
      onPress={onAttendees}
      divider={state === 'open' || closed}
    />,
  );
  if (state === 'open') {
    rows.push(
      <ControlRow
        key="close"
        icon={<CloseGlyph />}
        iconBg="#F7E3DF"
        title={t('eventHost.close')}
        titleColor={RED}
        subtitle={t('eventHost.closeHint')}
        onPress={onClose}
        divider={false}
      />,
    );
  }
  if (closed) {
    rows.push(
      <ControlRow
        key="reopen"
        icon={<CheckGlyph color={theme.colors.onFill} />}
        iconBg={theme.colors.fill}
        title={t('eventHost.reopen')}
        subtitle={spots !== null ? t('eventHost.spotsOpenUp', { count: spots }) : undefined}
        onPress={onReopen}
        divider={false}
      />,
    );
  }

  return (
    <>
      <MonoLabel style={{ fontSize: 10.5, marginTop: 20 }}>{t('eventHost.controls')}</MonoLabel>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, paddingVertical: 2, paddingHorizontal: 16, marginTop: 10 }}>{rows}</View>
    </>
  );
}

/** Coloured strip under the title card once a meet is closed, cancelled, or reopened. */
export function ClosureBanner({ tone, title, body }: { tone: 'closed' | 'cancelled' | 'open' | 'guest'; title?: string; body: string }) {
  const theme = useTheme();
  const colors = {
    closed: { bg: '#FBEFD0', dot: '#6B4E00', fg: '#3A2C00' },
    cancelled: { bg: '#FBEDEA', dot: RED, fg: '#3D4239' },
    open: { bg: '#EEF7DF', dot: '#4F6E19', fg: '#3D4239' },
    guest: { bg: '#EEF7DF', dot: '#4F6E19', fg: '#2F4210' },
  }[tone];
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.bg, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginTop: 12 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dot, marginTop: 6 }} />
      <View style={{ flex: 1, gap: 3 }}>
        {title ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: '#0E1113' }}>{title}</Text> : null}
        <Text style={{ fontFamily: fontFamily.interRegular, fontSize: title ? 12.5 : 13.5, lineHeight: 19, color: colors.fg }}>{body}</Text>
      </View>
    </View>
  );
}

/** Close this meet? Stop new RSVPs is reversible; Cancel is red and final. The confirm button follows the choice. */
export function CloseMeetSheet({
  visible,
  going,
  busy,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  going: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: (choice: 'rsvps_closed' | 'cancelled') => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [choice, setChoice] = useState<'rsvps_closed' | 'cancelled'>('rsvps_closed');
  const options = [
    { key: 'rsvps_closed' as const, title: t('eventHost.stopRsvps'), body: t('eventHost.stopRsvpsBody') },
    { key: 'cancelled' as const, title: t('eventHost.cancelMeet'), body: t('eventHost.cancelMeetBody') },
  ];
  const cancel = choice === 'cancelled';

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: 10 }}>
        <View style={{ paddingTop: 10, paddingHorizontal: 4, gap: 2 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fontFamily.jakartaBold, fontSize: 24, letterSpacing: -0.5, color: theme.colors.textPrimary }}>
            {t('eventHost.closeTitle')}
          </Text>
          <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary, paddingBottom: 4 }}>
            {t('eventHost.crewGoing', { count: going })}
          </Text>
        </View>
        {options.map((option) => {
          const on = choice === option.key;
          const red = option.key === 'cancelled';
          return (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                hapticSelection();
                setChoice(option.key);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 18,
                borderWidth: 2,
                borderColor: on ? (red ? RED : theme.colors.ink) : theme.colors.hairline,
                backgroundColor: on ? (red ? '#FBEDEA' : theme.colors.ground) : theme.colors.card,
              }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: on ? (red ? RED : theme.colors.ink) : theme.colors.textTertiary,
                  backgroundColor: on ? (red ? RED : theme.colors.ink) : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}>
                {on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: red ? '#FFFFFF' : theme.colors.fill }} /> : null}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15.5, color: red ? RED : theme.colors.textPrimary }}>{option.title}</Text>
                <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, lineHeight: 18, color: theme.colors.textSecondary }}>{option.body}</Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            hapticImpact();
            onConfirm(choice);
          }}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 28,
            marginTop: 6,
            backgroundColor: cancel ? RED : '#0E1113',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}>
          {busy ? (
            <ActivityIndicator color={cancel ? '#FFFFFF' : '#A8E05F'} />
          ) : (
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 16, color: cancel ? '#FFFFFF' : '#A8E05F' }}>
              {cancel ? t('eventHost.cancelMeetCta') : t('eventHost.closeRsvpsCta')}
            </Text>
          )}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 15, color: theme.colors.textPrimary }}>{t('eventHost.keepOpen')}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function PinGlyph({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={(size * 18) / 16} viewBox="0 0 16 18">
      <Path d="M8 17s6-5.6 6-10A6 6 0 002 7c0 4.4 6 10 6 10z" fill="#0E1113" />
      <Circle cx={8} cy={7} r={2.2} fill="#A8E05F" />
    </Svg>
  );
}

/** Venue in a small white card (host view, guest closed view). */
export function VenueChip({ venue, detail }: { venue: string; detail?: string | null }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.colors.card, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginTop: 16 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }}>
        <PinGlyph size={14} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14, color: theme.colors.textPrimary }}>{venue}</Text>
        {detail ? <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12, color: theme.colors.textTertiary }}>{detail}</Text> : null}
      </View>
    </View>
  );
}

/** Location: a live map, venue and address, then Directions and Open in Maps. */
export function EventLocation({ venue, address, city }: { venue?: string | null; address?: string | null; city: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const query = encodeURIComponent([venue, address, city].filter(Boolean).join(', '));
  const mapHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,iframe{margin:0;padding:0;border:0;width:100%;height:100%}</style></head><body><iframe src="https://maps.google.com/maps?q=${query}&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></body></html>`;
  return (
    <>
      <MonoLabel style={{ fontSize: 10.5, marginTop: 24 }}>{t('events.location')}</MonoLabel>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: 20, overflow: 'hidden', marginTop: 10 }}>
        <View style={{ height: 180, backgroundColor: theme.colors.field }} accessibilityLabel={t('events.mapOf', { place: venue || city })}>
          <WebView
            source={{ html: mapHtml }}
            originWhitelist={['*']}
            scrollEnabled={false}
            style={{ backgroundColor: theme.colors.field }}
            onShouldStartLoadWithRequest={(request) => request.url.startsWith('about:') || request.url.includes('google.com/maps')}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.fill, alignItems: 'center', justifyContent: 'center' }}>
            <PinGlyph />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 14.5, color: theme.colors.textPrimary }}>{venue || city}</Text>
            {address || venue ? (
              <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 12.5, color: theme.colors.textTertiary }}>{address || city}</Text>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`)}
            style={({ pressed }) => ({ flex: 1, height: 42, borderRadius: 21, backgroundColor: '#0E1113', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13.5, color: '#A8E05F' }}>{t('events.directions')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)}
            style={({ pressed }) => ({
              flex: 1,
              height: 42,
              borderRadius: 21,
              borderWidth: 1.5,
              borderColor: '#C9CEC1',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}>
            <Text style={{ fontFamily: fontFamily.jakartaBold, fontSize: 13.5, color: theme.colors.textPrimary }}>{t('events.openInMaps')}</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
