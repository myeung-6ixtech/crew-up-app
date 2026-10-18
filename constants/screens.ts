export const SCREENS = {
  tabs: {
    home: '/(tabs)',
    network: '/(tabs)/network',
    events: '/(tabs)/events',
    messages: '/(tabs)/messages',
    friends: '/(tabs)/friends',
    profile: '/(tabs)/profile',
  },
  auth: {
    welcome: '/auth/welcome',
    /** 4A → 4B: email, then password. */
    signUp: '/auth/sign-up',
    signUpPassword: '/auth/sign-up-password',
    /** 4C after sign up, 4K after a reset request. */
    checkInbox: (kind: 'verify' | 'reset') => ({ pathname: '/auth/check-inbox' as const, params: { kind } }),
    login: (email?: string) => ({ pathname: '/auth/login' as const, params: email ? { email } : {} }),
    forgotPassword: (email?: string) => ({ pathname: '/auth/forgot-password' as const, params: email ? { email } : {} }),
  },
  onboarding: {
    /** Profile steps 1–7 and beta_notify use the dynamic route; launch steps have their own. */
    step: (step: string) => `/onboarding/${step}` as const,
    betaHolding: '/onboarding/beta-holding',
    privacy: '/onboarding/privacy',
    guidelines: '/onboarding/guidelines',
    notifications: '/onboarding/notifications',
    unavailable: '/onboarding/unavailable',
    houseRules: '/onboarding/house-rules' as const,
    rosterIntro: '/onboarding/roster-intro',
  },
  trips: '/trips',
  roster: {
    upload: '/roster/upload',
    confirm: '/roster/confirm',
    manage: '/roster/manage',
    addTrip: '/roster/add-trip',
    addTripFlights: '/roster/add-trip/flights',
    addTripManual: '/roster/add-trip/manual',
    addTripAvailability: '/roster/add-trip/availability',
  },
  discover: {
    /** Search layovers; a saved layover passes its city and window. */
    search: (params?: { city?: string; from?: string; to?: string }) =>
      ({ pathname: '/discover/search', params: params ?? {} }) as const,
    layover: (tripId: string) => `/discover/layover/${tripId}` as const,
  },
  presence: (city: string) => `/presence/${encodeURIComponent(city)}` as const,
  network: {
    connections: '/network/connections',
    discover: '/network/discover',
    user: (userId: string) => `/network/${userId}` as const,
  },
  events: {
    detail: (id: string) => `/events/${id}` as const,
    create: '/events/create',
    edit: (id: string) => `/events/edit/${id}` as const,
    attendees: (id: string) => `/events/attendees/${id}` as const,
  },
  messages: {
    thread: (threadId: string, withUserId?: string) =>
      (withUserId ? `/messages/${threadId}?with=${withUserId}` : `/messages/${threadId}`) as `/messages/${string}`,
  },
  friends: {
    add: '/friends/add',
  },
  profile: {
    edit: '/profile/edit',
    editSection: (step: string) => `/profile/edit-section/${step}` as const,
    privacy: '/profile/privacy',
    language: '/profile/settings/language',
    security: '/profile/settings/account-security',
    blocked: '/profile/settings/blocked',
  },
  /** Settings & Privacy (6C) and the pages it pushes; Language and Privacy keep their profile routes. */
  settings: {
    index: '/settings',
    account: '/settings/account',
    appearance: '/settings/appearance',
    about: '/settings/about',
  },
  account: {
    delete: '/account/delete',
    deletionPending: '/account/deletion-pending',
  },
  legal: {
    guidelines: '/legal/guidelines',
    licenses: '/legal/licenses',
    safety: '/legal/safety',
  },
} as const;

export type VisibilityLevel =
  | 'off'
  | 'friends'
  | 'friends_of_friends'
  | 'same_airline'
  | 'all_verified';

export const VISIBILITY_LEVELS: VisibilityLevel[] = [
  'off',
  'friends',
  'friends_of_friends',
  'same_airline',
  'all_verified',
];

/** Quick tags are practical notes only. Dinner, coffee, hiking and karaoke are activities now. */
export const EVENT_TAGS = ['alcohol_free', 'halal_friendly', 'women_only'] as const;

export const ROLE_TYPES = ['cabin_crew', 'pilot', 'ground_ops'] as const;
