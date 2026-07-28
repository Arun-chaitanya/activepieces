import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  keywordsProp,
  matchTypeDropdown,
  mediaIdProp,
  mediaModeDropdown,
  socialIntegrationDropdown,
} from '../../common/props';

export const instagramCommentReceived = createOpplifyTrigger({
  name: 'instagram_comment_received',
  displayName: 'Instagram Comment Received',
  description:
    'Triggers when someone comments on your Instagram post or reel. Filter by keyword and post to build comment-to-DM automations.',
  eventType: 'instagram_comment_received',
  props: {
    integrationId: socialIntegrationDropdown,
    mediaMode: mediaModeDropdown,
    mediaId: mediaIdProp,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
  },
  sampleData: SAMPLE_DATA.instagram_comment_received,
});
