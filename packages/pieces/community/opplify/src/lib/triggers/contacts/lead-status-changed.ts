import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const leadStatusChanged = createOpplifyTrigger({
  name: 'lead_status_changed',
  displayName: 'Lead Status Changed',
  description:
    "Triggers when a lead's status changes. To react to a specific new status, add rules in the Filters panel.",
  eventType: 'status_changed',
  props: {},
  sampleData: SAMPLE_DATA.status_changed,
});
