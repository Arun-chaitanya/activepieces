import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import { socialIntegrationDropdown } from '../../common/props';

export const instagramMentionReceived = createOpplifyTrigger({
  name: 'instagram_mention_received',
  displayName: 'Instagram Mention Received',
  description:
    'Triggers when someone mentions your Instagram account in a post or comment.',
  eventType: 'instagram_mention_received',
  props: {
    integrationId: socialIntegrationDropdown,
  },
  sampleData: SAMPLE_DATA.instagram_mention_received,
});
