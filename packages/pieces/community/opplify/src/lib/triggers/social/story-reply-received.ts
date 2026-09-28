import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  keywordsProp,
  matchTypeDropdown,
  socialIntegrationsMultiDropdown,
} from '../../common/props';

/** One story-reply trigger for Instagram stories and Facebook Page stories. */
export const storyReplyReceived = createOpplifyTrigger({
  name: 'story_reply_received',
  displayName: 'Story reply received',
  description:
    'Triggers when someone replies to your Instagram or Facebook story. Pick the accounts, filter by keyword or leave open to catch every reply.',
  eventTypes: ['instagram_story_reply_received', 'facebook_story_reply_received'],
  props: {
    integrationIds: socialIntegrationsMultiDropdown,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
  },
  sampleData: SAMPLE_DATA.story_reply_received,
});
