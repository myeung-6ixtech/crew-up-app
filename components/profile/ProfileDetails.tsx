import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@crewup/shared';
import { FactRow, PillGroup, WhiteCard } from '@/components/crew/kit';
import { ActivityIcon } from '@/components/icons/ActivityIcon';
import { findAirportByIata } from '@/constants/airports';
import { MonoLabel } from '@/features/onboarding/components/kit';
import { hapticSelection } from '@/lib/haptics';
import { fontFamily, useTheme } from '@/theme';
import type { ActivityPreference } from '@/types/domain';

const LANGUAGE_NAMES = new Map(LANGUAGES.map(([code, name]) => [code, name]));
const TOP_ACTIVITIES = 8;

/** The profile fields both views show. A Crew ID is deliberately not part of this: it's owner-only. */
export type ProfileDetailsPerson = {
  crew_role?: string | null;
  role_type?: string | null;
  base_airport?: string | null;
  base_airport_iata?: string | null;
  residence_city?: string | null;
  residence_country_code?: string | null;
  hometown_city?: string | null;
  home_country_code?: string | null;
  languages?: string[] | null;
};

/** 58px white circle with the ink icon, name below; four across. */
function ActivityTile({ activity }: { activity: ActivityPreference }) {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel={activity.name} style={{ width: '25%', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: theme.colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#0E1113',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        }}>
        <ActivityIcon slug={activity.slug} name={activity.name} fallback={activity.icon} size={30} color={theme.colors.textPrimary} />
      </View>
      <Text numberOfLines={2} style={{ fontFamily: fontFamily.interMedium, fontSize: 12, lineHeight: 15, color: theme.colors.textPrimary, textAlign: 'center' }}>
        {activity.name}
      </Text>
    </View>
  );
}

/**
 * The profile body shared by your own Profile and someone else's: role / airline / base, places, languages,
 * activities (top 8 as icon tiles) and interests. `expandable` (own profile) adds See all / Show top 8.
 */
export function ProfileDetails({
  person,
  airlineName,
  preferences,
  expandable = false,
}: {
  person: ProfileDetailsPerson;
  airlineName?: string | null;
  preferences: ActivityPreference[];
  expandable?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const airport = findAirportByIata(person.base_airport_iata ?? person.base_airport);
  const role = person.crew_role ? t(`onboarding.crewRoles.${person.crew_role}`) : person.role_type;
  const facts = [
    role ? { label: t('onboarding.crew.role'), value: role } : null,
    airlineName ? { label: t('onboarding.crew.airline'), value: airlineName } : null,
    airport || person.base_airport ? { label: t('profile.base'), value: airport ? `${airport.iata} · ${airport.city}` : (person.base_airport ?? '') } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);

  const place = (city?: string | null, code?: string | null) => [city, code].filter(Boolean).join(', ');
  const placesLine = [
    person.residence_city ? t('onboarding.review.livesIn', { place: place(person.residence_city, person.residence_country_code) }) : null,
    person.hometown_city ? t('onboarding.review.from', { place: place(person.hometown_city, person.home_country_code) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const languages = (person.languages ?? []).map((code) => LANGUAGE_NAMES.get(code) ?? code);
  const activities = preferences.filter((item) => item.kind === 'activity');
  const interests = preferences.filter((item) => item.kind === 'interest').map((item) => item.name);
  const shown = expandable && expanded ? activities : activities.slice(0, TOP_ACTIVITIES);
  const more = activities.length > TOP_ACTIVITIES;

  return (
    <View>
      {facts.length ? (
        <WhiteCard style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 4 }}>
          {facts.map((fact, index) => (
            <FactRow key={fact.label} label={fact.label} value={fact.value} last={index === facts.length - 1} />
          ))}
        </WhiteCard>
      ) : null}

      <View style={{ gap: 14, marginTop: 18 }}>
        {placesLine ? (
          <View style={{ gap: 8 }}>
            <MonoLabel style={{ fontSize: 10.5 }}>{t('onboarding.review.placesSection')}</MonoLabel>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textPrimary }}>{placesLine}</Text>
          </View>
        ) : null}
        <PillGroup label={t('onboarding.review.languagesSection')} names={languages} />
        {activities.length ? (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <MonoLabel style={{ fontSize: 10.5 }}>{t('onboarding.review.activitiesSection')}</MonoLabel>
              {expandable && more ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    hapticSelection();
                    setExpanded((value) => !value);
                  }}>
                  <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.accentText }}>
                    {expanded ? t('profile.showTopActivities', { count: TOP_ACTIVITIES }) : t('profile.seeAllActivities', { count: activities.length })}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginTop: 12, marginHorizontal: -4 }}>
              {shown.map((activity) => (
                <ActivityTile key={activity.activityId} activity={activity} />
              ))}
            </View>
          </View>
        ) : null}
        <PillGroup label={t('onboarding.review.interestsSection')} names={interests} />
      </View>
    </View>
  );
}
