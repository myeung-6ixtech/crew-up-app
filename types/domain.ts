import type { CrewRole, OnboardingStep } from '@crewup/shared';
import type { VisibilityLevel } from '@/constants/screens';

export interface Profile {
  user_id: string;
  /** Legacy: kept in sync as preferred_name ?? full_name by the onboarding step Function. */
  display_name: string;
  airline_id?: string | null;
  base_airport?: string | null;
  role_type?: string | null;
  rank?: string | null;
  show_rank: boolean;
  preferred_language: string;
  default_visibility: VisibilityLevel;
  notification_mode: string;
  is_verified: boolean;
  avatar_file_id?: string | null;
  friend_id?: string | null;
  full_name?: string | null;
  full_name_native?: string | null;
  preferred_name?: string | null;
  username?: string | null;
  /** date_of_birth for the caller's own row only (Hasura computed field). */
  own_date_of_birth?: string | null;
  home_country_code?: string | null;
  hometown_city?: string | null;
  /** Owner-only. Null when another crew member's profile is loaded. */
  own_hometown_latitude?: number | null;
  own_hometown_longitude?: number | null;
  languages?: string[] | null;
  /** Owner always; other crew only when they chose to show it. */
  visible_gender?: 'male' | 'female' | 'unspecified' | null;
  /** Owner-only. Null on someone else's profile. */
  own_show_gender?: boolean | null;
  residence_country_code?: string | null;
  residence_city?: string | null;
  crew_role?: CrewRole | null;
  base_airport_iata?: string | null;
}

export interface OnboardingStateRow {
  user_id: string;
  current_step: OnboardingStep | null;
  flow_version: number;
  beta_signup_completed_at: string | null;
  onboarding_completed_at: string | null;
  guidelines_accepted_version: string | null;
}

export interface RosterEntry {
  id?: string;
  flight_number?: string | null;
  departure_airport?: string | null;
  arrival_airport?: string | null;
  layover_city?: string | null;
  layover_start?: string | null;
  layover_end?: string | null;
  source?: string;
  notes?: string | null;
}

export interface ParsedRosterEntry {
  flightNumber?: string | null;
  departureAirport?: string | null;
  arrivalAirport?: string | null;
  layoverCity?: string | null;
  layoverStart?: string | null;
  layoverEnd?: string | null;
}

export interface Activity {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  icon?: string | null;
  sort_order: number;
}

export interface EventItem {
  id: string;
  title: string;
  city: string;
  starts_at: string;
  ends_at?: string | null;
  capacity?: number | null;
  visibility_scope: string;
  tags: string[];
  languages: string[];
  creator_id: string;
  host_type?: 'user' | 'platform';
  is_published?: boolean;
  featured_until?: string | null;
  eventActivities?: Array<{
    activity: { id?: string; slug: string; name: string; icon?: string | null };
  }>;
}

export interface ThreadItem {
  id: string;
  type: string;
  updated_at: string;
  event_id?: string | null;
}

export interface MessageItem {
  id: string;
  thread_id: string;
  sender_id: string;
  body?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title?: string | null;
  body?: string | null;
  read_at?: string | null;
  created_at: string;
  payload?: Record<string, unknown>;
}
