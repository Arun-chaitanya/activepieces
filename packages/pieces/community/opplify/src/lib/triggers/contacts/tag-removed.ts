import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const tagRemoved = createOpplifyTrigger({
  name: 'tag_removed',
  displayName: 'Tag Removed',
  description:
    'Triggers when a tag is removed from a lead. To react to specific tags, add rules in the Filters panel.',
  eventType: 'tag_removed',
  props: {},
  sampleData: SAMPLE_DATA.tag_removed,
});
