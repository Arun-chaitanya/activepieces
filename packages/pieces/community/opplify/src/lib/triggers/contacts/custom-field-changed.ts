import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const customFieldChanged = createOpplifyTrigger({
  name: 'custom_field_changed',
  displayName: 'Custom Field Changed',
  description:
    'Triggers when any custom field value changes on a lead. To react to a specific field or value, add rules in the Filters panel.',
  eventType: 'custom_field_changed',
  props: {},
  sampleData: SAMPLE_DATA.custom_field_changed,
});
