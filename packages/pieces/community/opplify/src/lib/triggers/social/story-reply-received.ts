import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  instagramIntegrationsMultiDropdown,
  keywordsProp,
  matchTypeDropdown,
} from '../../common/props';

/**
 * Story replies, Instagram only. Facebook Page story replies reach the
 * Messenger webhook as ordinary messages with no story marker (verified on
 * live payloads and the Graph message node, 2026-09-29), so no Facebook
 * event type is subscribed and no Facebook account is offered.
 */
export const storyReplyReceived = createOpplifyTrigger({
  name: 'story_reply_received',
  displayName: 'Story reply received',
  description:
    'Triggers when someone replies to your Instagram story. Pick the accounts, filter by keyword or leave open to catch every reply. Facebook Page story replies arrive as ordinary messages, so use Message received for those.',
  eventTypes: ['instagram_story_reply_received'],
  props: {
    integrationIds: instagramIntegrationsMultiDropdown,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
  },
  sampleData: SAMPLE_DATA.story_reply_received,
});
