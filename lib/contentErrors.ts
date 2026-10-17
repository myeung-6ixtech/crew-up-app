import type { TFunction } from 'i18next';

function errorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  const parts: string[] = [];
  const e = error as { message?: string; graphQLErrors?: { message?: string }[]; errors?: { message?: string }[] };
  if (e.message) parts.push(e.message);
  for (const item of [...(e.graphQLErrors ?? []), ...(e.errors ?? [])]) if (item.message) parts.push(item.message);
  return parts.join(' ');
}

/** "That includes words we don't allow" when a server trigger raised CONTENT_BLOCKED, otherwise null. */
export function contentBlockedMessage(error: unknown, t: TFunction): string | null {
  return errorText(error).includes('CONTENT_BLOCKED') ? t('moderation.contentBlocked') : null;
}

/** Why a chat message didn't send: filtered words, a block, or a generic failure. */
export function messageSendError(error: unknown, t: TFunction): string {
  const blocked = contentBlockedMessage(error, t);
  if (blocked) return blocked;
  if (/insert permission has failed|permission has failed/i.test(errorText(error))) return t('messages.cantSend');
  return t('onboarding.genericError');
}
