import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';
import {
  intentDescriptionProp,
  intentProp,
  requireEmailInMessageProp,
  keywordsProp,
  matchTypeDropdown,
  socialIntegrationsMultiDropdown,
} from '../../common/props';

/** One direct-message trigger for Instagram DMs and Facebook Messenger. */
export const dmReceived = createOpplifyTrigger({
  name: 'dm_received',
  displayName: 'Message received',
  description:
    'Triggers when someone sends your Instagram account or Facebook Page a direct message. Pick the accounts and filter by keyword or meaning to build keyword automations.',
  eventTypes: ['instagram_dm_received', 'facebook_dm_received'],
  props: {
    integrationIds: socialIntegrationsMultiDropdown,
    keywords: keywordsProp,
    matchType: matchTypeDropdown,
    intent: intentProp,
    intentDescription: intentDescriptionProp,
    requireEmailInMessage: requireEmailInMessageProp,
  },
  sampleData: SAMPLE_DATA.dm_received,
});
