import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const leadDndChanged = createOpplifyTrigger({
  name: 'lead_dnd_changed',
  displayName: 'Lead DND Changed',
  description:
    "Triggers when a lead's Do Not Disturb settings change. To react only when DND turns on (or off), add rules in the Filters panel.",
  eventType: 'dnd_changed',
  props: {},
  sampleData: SAMPLE_DATA.dnd_changed,
});
