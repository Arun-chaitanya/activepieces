import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const newLeadCreated = createOpplifyTrigger({
  name: 'new_lead_created',
  displayName: 'New Lead Created',
  description:
    'Triggers when a new lead is created — via form submission, manual creation, import, or API. To react to specific sources, add rules in the Filters panel.',
  eventType: 'lead_created',
  props: {},
  sampleData: SAMPLE_DATA.lead_created,
});
