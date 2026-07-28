import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  keywordsProp,
  matchTypeDropdown,
  mediaIdProp,
  mediaModeDropdown,
  socialIntegrationDropdown,
} from '../../common/props';

export const facebookCommentReceived = createOpplifyTrigger({
  name: 'facebook_comment_received',
  displayName: 'Facebook Comment Received',
  description:
    'Triggers when someone comments on your Facebook Page post. Filter by keyword and post to build comment-to-DM automations.',
  eventType: 'facebook_comment_received',
  props: {
    integrationId: socialIntegrationDropdown,
    mediaMode: mediaModeDropdown,
    mediaId: mediaIdProp,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
  },
  sampleData: SAMPLE_DATA.facebook_comment_received,
});
