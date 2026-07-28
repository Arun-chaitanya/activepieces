import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  keywordsProp,
  matchTypeDropdown,
  socialIntegrationDropdown,
} from '../../common/props';

export const facebookDmReceived = createOpplifyTrigger({
  name: 'facebook_dm_received',
  displayName: 'Facebook Message Received',
  description:
    'Triggers when someone sends your Facebook Page a Messenger message. Filter by keyword to build keyword automations.',
  eventType: 'facebook_dm_received',
  props: {
    integrationId: socialIntegrationDropdown,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
  },
  sampleData: SAMPLE_DATA.facebook_dm_received,
});
