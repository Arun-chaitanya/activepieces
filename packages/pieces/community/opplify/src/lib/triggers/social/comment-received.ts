import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  keywordsProp,
  matchTypeDropdown,
  mediaIdProp,
  mediaModeDropdown,
  socialIntegrationsMultiDropdown,
} from '../../common/props';

/**
 * One comment trigger for both platforms: subscribes to the Instagram AND
 * the Facebook comment event, narrowed by the selected accounts.
 */
export const commentReceived = createOpplifyTrigger({
  name: 'comment_received',
  displayName: 'Comment received',
  description:
    'Triggers when someone comments on your Instagram post/reel or your Facebook Page post. Pick the accounts, filter by keyword and post to build comment-to-DM and public-reply automations.',
  eventTypes: ['instagram_comment_received', 'facebook_comment_received'],
  props: {
    integrationIds: socialIntegrationsMultiDropdown,
    mediaMode: mediaModeDropdown,
    mediaId: mediaIdProp,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
  },
  sampleData: SAMPLE_DATA.comment_received,
});
