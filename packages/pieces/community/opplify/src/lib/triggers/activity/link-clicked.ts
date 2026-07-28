import { createOpplifyTrigger } from '../../common/create-opplify-trigger';
import { SAMPLE_DATA } from '../../common/constants';

export const linkClicked = createOpplifyTrigger({
  name: 'link_clicked',
  displayName: 'Tracked Link Clicked',
  description:
    'Triggers when someone clicks a tracked button link from one of your automated messages (turn on "Track button clicks" on the send step).',
  eventType: 'link_clicked',
  props: {},
  sampleData: SAMPLE_DATA.link_clicked,
});
