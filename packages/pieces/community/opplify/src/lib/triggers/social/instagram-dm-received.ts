import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  intentDescriptionProp,
  intentProp,
  requireEmailInMessageProp,
  keywordsProp,
  matchTypeDropdown,
  socialIntegrationDropdown,
} from '../../common/props';

export const instagramDmReceived = createOpplifyTrigger({
  name: 'instagram_dm_received',
  displayName: 'Instagram Message Received',
  description:
    'Triggers when someone sends your Instagram account a direct message. Filter by keyword to build keyword automations.',
  eventType: 'instagram_dm_received',
  props: {
    integrationId: socialIntegrationDropdown,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
    intent: intentProp,
    intentDescription: intentDescriptionProp,
    requireEmailInMessage: requireEmailInMessageProp,
  },
  sampleData: SAMPLE_DATA.instagram_dm_received,
});
