import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { socialIntegrationsMultiDropdown } from '../../common/props';

/** One mention trigger for Instagram story/comment mentions and Facebook Page mentions. */
export const mentionReceived = createOpplifyTrigger({
  name: 'mention_received',
  displayName: 'Mention received',
  description:
    'Triggers when someone mentions your Instagram account in a story or comment, or mentions your Facebook Page in a post or comment.',
  eventTypes: ['instagram_mention_received', 'facebook_mention_received'],
  props: {
    integrationIds: socialIntegrationsMultiDropdown,
  },
  sampleData: SAMPLE_DATA.mention_received,
});
