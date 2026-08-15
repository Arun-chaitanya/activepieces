import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const dealStageChanged = createOpplifyTrigger({
  name: 'deal_stage_changed',
  displayName: 'Deal Stage Changed',
  description:
    'Triggers when a deal moves to a different pipeline stage. To react to a specific stage, add rules in the Filters panel.',
  eventType: 'deal_stage_changed',
  props: {},
  sampleData: SAMPLE_DATA.deal_stage_changed,
});
