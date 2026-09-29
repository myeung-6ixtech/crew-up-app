export const SCREENS = {
  tabs: {
    home: '/(tabs)',
    network: '/(tabs)/network',
    events: '/(tabs)/events',
    messages: '/(tabs)/messages',
    friends: '/(tabs)/friends',
  },
  auth: {
    welcome: '/auth/welcome',
    email: (mode: 'signup' | 'signin' = 'signup') =>
      `/auth/email?mode=${mode}` as const,
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
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
  },
  messages: {
    thread: (threadId: string) => `/messages/${threadId}` as const,
  },
  friends: {
    add: '/friends/add',
  },
  profile: {
    edit: '/profile/edit',
    editSection: (step: string) => `/profile/edit-section/${step}` as const,
    privacy: '/profile/privacy',
    verification: '/profile/verification-status',
    language: '/profile/settings/language',
    security: '/profile/settings/account-security',
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

export const EVENT_TAGS = [
  'alcohol_free',
  'halal_friendly',
  'women_only',
  'karaoke',
  'dinner',
  'coffee',
  'hiking',
] as const;

export const ROLE_TYPES = ['cabin_crew', 'pilot', 'ground_ops'] as const;
