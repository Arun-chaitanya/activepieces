import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  keywordsProp,
  matchTypeDropdown,
  socialIntegrationDropdown,
} from '../../common/props';

export const instagramStoryReplyReceived = createOpplifyTrigger({
  name: 'instagram_story_reply_received',
  displayName: 'Instagram Story Reply Received',
  description:
    'Triggers when someone replies to your Instagram story. Filter by keyword or leave open to catch every reply.',
  eventType: 'instagram_story_reply_received',
  props: {
    integrationId: socialIntegrationDropdown,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
  },
  sampleData: SAMPLE_DATA.instagram_story_reply_received,
});
