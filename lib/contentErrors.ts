import type { TFunction } from 'i18next';

function walkError(value: unknown, parts: string[]) {
  if (!value || typeof value !== 'object') return;
  const record = value as {
    message?: unknown;
    graphQLErrors?: unknown[];
    errors?: unknown[];
    extensions?: { internal?: { error?: { message?: unknown } } };
  };
  if (typeof record.message === 'string') parts.push(record.message);
  const internal = record.extensions?.internal?.error?.message;
  if (typeof internal === 'string') parts.push(internal);
  for (const item of [...(record.graphQLErrors ?? []), ...(record.errors ?? [])]) walkError(item, parts);
}

function errorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  const parts: string[] = [];
  walkError(error, parts);
  return parts.join(' ');
}

/** "That includes words we don't allow" when a server trigger raised CONTENT_BLOCKED, otherwise null. */
export function contentBlockedMessage(error: unknown, t: TFunction): string | null {
  return errorText(error).includes('CONTENT_BLOCKED') ? t('moderation.contentBlocked') : null;
}

/** Why a chat message didn't send: filtered words, a block, or a generic failure. */
export function messageSendError(error: unknown, t: TFunction): string {
  const text = errorText(error);
  const blocked = text.includes('CONTENT_BLOCKED') ? t('moderation.contentBlocked') : null;
  if (blocked) return blocked;
  if (text.includes('MESSAGE_TOO_LONG')) return t('messages.tooLong');
  if (text.includes('MESSAGE_RATE_LIMITED')) return t('messages.tooFast');
  if (/insert permission has failed|permission has failed/i.test(text)) return t('messages.cantSend');
  return t('onboarding.genericError');
}
