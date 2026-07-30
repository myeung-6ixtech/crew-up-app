import { gql } from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($userId: uuid!) {
    notifications(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 50
    ) {
      id
      type
      title
      body
      read_at
      created_at
      payload
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: uuid!, $readAt: timestamptz!) {
    update_notifications_by_pk(
      pk_columns: { id: $id }
      _set: { read_at: $readAt }
    ) {
      id
    }
  }
`;

export const NOTIFICATIONS_SUBSCRIPTION = gql`
  subscription NotificationsSubscription($userId: uuid!) {
    notifications(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 20
    ) {
      id
      type
      title
      body
      read_at
      created_at
      payload
    }
  }
`;
