import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const leadLifecycleChanged = createOpplifyTrigger({
  name: 'lead_lifecycle_changed',
  displayName: 'Lead Lifecycle Changed',
  description:
    "Triggers when a lead's lifecycle stage changes. To react to a specific stage, add rules in the Filters panel.",
  eventType: 'lifecycle_changed',
  props: {},
  sampleData: SAMPLE_DATA.lifecycle_changed,
});
