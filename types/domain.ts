import type { VisibilityLevel } from '@/constants/screens';

export interface Profile {
  user_id: string;
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
}

export interface ParsedRosterEntry {
  flightNumber?: string | null;
  departureAirport?: string | null;
  arrivalAirport?: string | null;
  layoverCity?: string | null;
  layoverStart?: string | null;
  layoverEnd?: string | null;
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
