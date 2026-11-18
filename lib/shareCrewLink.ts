import { Platform, Share } from 'react-native';
import type { TFunction } from 'i18next';
import { crewLink } from '@/lib/crewLink';
import { formatFriendId } from '@/lib/friendId';

/**
 * Shares your Crew ID as a CrewUp link with CrewUp's own wording on both platforms.
 *
 * - iOS: the text goes in `message` and the link in `url` (sent once, not twice). The sheet's header preview
 *   (title, icon/image) comes from the link's web page: the Open Graph tags on crewup.app/c/… (documentation/crew-qr).
 *   `subject` is the email subject.
 * - Android: there is no separate url field, so the link is inside the message; `title` / `dialogTitle` name the
 *   share sheet ("Share your Crew ID") and the subject apps like Gmail use.
 */
export async function shareCrewLink(friendId: string, t: TFunction) {
  const link = crewLink(friendId);
  const crewId = formatFriendId(friendId);
  const title = t('friends.shareSheetTitle');
  if (Platform.OS === 'ios') {
    return Share.share({ message: t('friends.shareCrewIdText', { crewId }), url: link }, { subject: t('friends.shareSubject') });
  }
  return Share.share(
    { title: t('friends.shareSubject'), message: t('friends.shareCrewIdLinkMessage', { crewId, link }) },
    { dialogTitle: title },
  );
}
