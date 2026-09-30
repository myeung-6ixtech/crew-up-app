/** Calendar distance from account creation, never a clock time. */
export function memberSinceWhen(iso: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const created = new Date(iso);
  const now = new Date();
  const createdDay = Date.UTC(created.getFullYear(), created.getMonth(), created.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - createdDay) / 86_400_000);
  if (days <= 0) return t('onboarding.review.sinceToday');
  if (days === 1) return t('onboarding.review.sinceYesterday');
  if (days < 30) return t('onboarding.review.sinceDays', { count: days });
  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? t('onboarding.review.sinceMonth') : t('onboarding.review.sinceMonths', { count: months });
  }
  const years = Math.floor(days / 365);
  return years <= 1 ? t('onboarding.review.sinceYear') : t('onboarding.review.sinceYears', { count: years });
}
