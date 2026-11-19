import { Text, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fontFamily, useTheme } from '@/theme';

type Person = {
  residence_city?: string | null;
  residence_country_code?: string | null;
  hometown_city?: string | null;
  home_country_code?: string | null;
};

const MARK = '\u0000';

/**
 * "Lives in **Toronto, CA** · From **Hong Kong, HK**" for a profile header: the words stay regular, the city and
 * country code are bold. Works with any translation of "Lives in {{place}}" / "From {{place}}".
 */
export function PlacesLine({ person, style }: { person: Person | null | undefined; style?: TextStyle }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const parts = [
    person?.residence_city ? { key: 'livesIn', place: [person.residence_city, person.residence_country_code].filter(Boolean).join(', ') } : null,
    person?.hometown_city ? { key: 'from', place: [person.hometown_city, person.home_country_code].filter(Boolean).join(', ') } : null,
  ].filter((part): part is { key: string; place: string } => part !== null);
  if (!parts.length) return null;
  const strong: TextStyle = { fontFamily: fontFamily.interSemiBold, color: theme.colors.textPrimary };
  return (
    <Text style={[{ fontFamily: fontFamily.interRegular, fontSize: 13.5, color: theme.colors.textSecondary }, style]}>
      {parts.map((part, index) => {
        const [before, after = ''] = t(`onboarding.review.${part.key}`, { place: MARK }).split(MARK);
        return (
          <Text key={part.key}>
            {index ? ' · ' : ''}
            {before}
            <Text style={strong}>{part.place}</Text>
            {after}
          </Text>
        );
      })}
    </Text>
  );
}
