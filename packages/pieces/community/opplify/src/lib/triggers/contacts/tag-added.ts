import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const tagAdded = createOpplifyTrigger({
  name: 'tag_added',
  displayName: 'Tag Added',
  description:
    'Triggers when a tag is added to a lead — by rules, manual action, or workflow. To react to specific tags, add rules in the Filters panel.',
  eventType: 'tag_added',
  props: {},
  sampleData: SAMPLE_DATA.tag_added,
});
