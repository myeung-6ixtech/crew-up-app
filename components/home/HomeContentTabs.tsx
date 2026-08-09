import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { HOME_SECTION_PADDING } from '@/constants/homeLayout';
import { useThemedStyles } from '@/theme';

export type HomeTabId = 'trips' | 'paths' | 'activity';

type HomeTab = {
  id: HomeTabId;
  label: string;
};

function HomeTabPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles((t) => ({
    pill: {
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: selected ? t.colors.accent : t.colors.hairline,
      backgroundColor: selected ? t.colors.accentSubtle : t.colors.bgSurface,
    },
    text: {
      ...t.typography.bodyStrong,
      color: selected ? t.colors.accent : t.colors.textSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.pill, { opacity: pressed ? 0.72 : 1 }]}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

export function HomeContentTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  tabs: HomeTab[];
  activeTab: HomeTabId;
  onTabChange: (tab: HomeTabId) => void;
  children: ReactNode;
}) {
  const styles = useThemedStyles((t) => ({
    section: {
      paddingHorizontal: HOME_SECTION_PADDING,
      paddingTop: t.spacing.md,
      paddingBottom: t.spacing.xxxl,
      alignItems: 'center',
    },
    tabRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: t.spacing.sm,
      marginBottom: t.spacing.xl,
    },
    panel: {
      width: '100%',
      minHeight: 280,
      alignItems: 'center',
    },
  }));

  return (
    <View style={styles.section} accessibilityRole="tablist">
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <HomeTabPill
            key={tab.id}
            label={tab.label}
            selected={activeTab === tab.id}
            onPress={() => onTabChange(tab.id)}
          />
        ))}
      </View>
      <View style={styles.panel} accessibilityRole="tabpanel">
        {children}
      </View>
    </View>
  );
}
